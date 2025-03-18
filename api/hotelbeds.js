// api/hotelbeds.js
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Configuração do Supabase (certifique-se de ter as variáveis de ambiente configuradas)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Endpoints da Hotelbeds (use "api.test" para teste; em produção, troque para "api.")
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Função para gerar assinatura
function generateSignature(apiKey, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  return crypto.createHash("sha256").update(apiKey + secretKey + timestamp).digest("hex");
}

// Função de delay (para espaçar chamadas à Content API e evitar sobrecarga)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Tempo de expiração do cache: 24 horas (em milissegundos)
const CACHE_EXPIRE_MS = 24 * 3600 * 1000;

/**
 * Atualiza (ou insere) o cache da Content API para um hotel específico.
 * Essa função é chamada em background.
 * @param {string|number} hotelCode - Código do hotel
 * @param {string} signature - Assinatura gerada
 * @param {string} apiKey - Chave pública da API
 */
async function updateHotelContentCache(hotelCode, signature, apiKey) {
  try {
    const contentUrl = `${CONTENT_URL}?codes=${hotelCode}&language=ENG&fields=all`;
    const headers = {
      "Api-Key": apiKey,
      "X-Signature": signature,
      "Accept": "application/json"
    };
    const response = await fetch(contentUrl, { method: "GET", headers });
    const contentData = await response.json();
    if (!response.ok) {
      console.warn(`Erro ao atualizar cache para hotel ${hotelCode}:`, contentData);
      return;
    }
    const now = new Date().toISOString();
    await supabase
      .from("hotels_content")
      .upsert({
        hotel_code: hotelCode,
        content_json: contentData,
        last_updated: now
      }, { onConflict: "hotel_code" });
  } catch (err) {
    console.error(`Erro no cache do hotel ${hotelCode}:`, err);
  }
}

const router = Router();

router.get("/hotels", async (req, res) => {
  try {
    // 1) Extrair parâmetros da query
    const { checkIn = "2025-06-15", checkOut = "2025-06-16", destination = "MCO" } = req.query;
    const roomsCount = parseInt(req.query.rooms || "1", 10);
    const occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const adults = parseInt(req.query[`adults${i}`] || "2", 10);
      const children = parseInt(req.query[`children${i}`] || "0", 10);
      occupancies.push({ rooms: 1, adults, children });
    }
    if (!occupancies.length) {
      occupancies.push({ rooms: 1, adults: 2, children: 0 });
    }
    
    // 2) Verificar credenciais
    const apiKey = process.env.API_KEY_HH;
    const apiSec = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSec) {
      return res.status(500).json({ error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH)." });
    }
    
    // 3) Gerar assinatura
    const signature = generateSignature(apiKey, apiSec);
    
    // 4) Chamada à Booking API (sempre feita para obter preços atualizados)
    const bookingHeaders = {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    const bodyData = { stay: { checkIn, checkOut }, occupancies, destination: { code: destination } };
    const respBooking = await fetch(`${BOOKING_URL}?limit=20`, {
      method: "POST",
      headers: bookingHeaders,
      body: JSON.stringify(bodyData)
    });
    const bookingJson = await respBooking.json();
    if (!respBooking.ok) {
      return res.status(respBooking.status).json({
        error: bookingJson.error || "Erro na API (Booking)",
        details: bookingJson
      });
    }
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({ availability: bookingJson, combined: [] });
    }
    
    // 5) Consultar o cache (tabela "hotels_content") para os hotéis retornados
    const hotelCodes = hotelsArray.map(h => h.code);
    const { data: cachedContents } = await supabase
      .from("hotels_content")
      .select("*")
      .in("hotel_code", hotelCodes);
    const cacheMap = {};
    if (cachedContents) {
      cachedContents.forEach(row => {
        cacheMap[row.hotel_code] = row;
      });
    }
    
    // 6) Para cada hotel, se o cache não existir ou estiver expirado, atualize-o em background
    for (const hotel of hotelsArray) {
      const cached = cacheMap[hotel.code];
      if (!cached || Date.now() - new Date(cached.last_updated).getTime() > CACHE_EXPIRE_MS) {
        updateHotelContentCache(hotel.code, signature, apiKey);
        // Pequeno delay para não sobrecarregar a API
        await sleep(250);
      }
    }
    
    // 7) Construa o array combinado usando os dados do cache (se disponíveis)
    const combined = hotelsArray.map(bkHotel => {
      const cached = cacheMap[bkHotel.code];
      return {
        code: bkHotel.code,
        name: bkHotel.name,
        categoryCode: bkHotel.categoryCode,
        categoryName: bkHotel.categoryName,
        minRate: bkHotel.minRate,
        maxRate: bkHotel.maxRate,
        currency: bkHotel.currency,
        rooms: bkHotel.rooms,
        content: cached && cached.content_json?.hotels && cached.content_json.hotels[0]
          ? {
              name: cached.content_json.hotels[0].name,
              description: cached.content_json.hotels[0].description?.content || "",
              categoryName: cached.content_json.hotels[0].categoryName,
              facilities: (cached.content_json.hotels[0].facilities || []).map(f => f.description?.content || ""),
              images: (cached.content_json.hotels[0].images || []).map(img => `https://photos.hotelbeds.com/giata/xl/${img.path}`),
              interestPoints: cached.content_json.hotels[0].interestPoints || []
            }
          : null
      };
    });
    
    // 8) Retorna a resposta para o front-end
    return res.json({ availability: bookingJson, combined });
    
  } catch (err) {
    console.error("Erro /api/hotelbeds/hotels =>", err);
    return res.status(500).json({
      error: "Erro interno ao buscar Disponibilidade + Conteúdo",
      message: err.message
    });
  }
});

// Rota GET para obter conteúdo detalhado de um hotel (se necessário)
router.get("/hotel-content", async (req, res) => {
  try {
    const { hotelCode } = req.query;
    if (!hotelCode) {
      return res.status(400).json({ error: "Parâmetro 'hotelCode' obrigatório." });
    }
    const signature = generateSignature(process.env.API_KEY_HH, process.env.SECRET_KEY_HH);
    const url = `${CONTENT_URL}?codes=${hotelCode}&language=ENG&fields=all`;
    const headers = {
      "Api-Key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Accept": "application/json"
    };
    const response = await fetch(url, { method: "GET", headers });
    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result.error || "Erro na API (Content)" });
    }
    return res.json(result);
  } catch (err) {
    console.error("Erro na rota /hotel-content:", err);
    return res.status(500).json({ error: "Erro interno na rota /hotel-content", message: err.message });
  }
});

export default router;
