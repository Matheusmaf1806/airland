import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Configura o Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// URLs base (use "api.test" para teste e "api." para produção)
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Função para gerar assinatura
function generateSignature(apiKey, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  return crypto.createHash("sha256").update(apiKey + secretKey + timestamp).digest("hex");
}

// Função para "dormir" (pausa) entre chamadas, para evitar rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Consulta o cache no Supabase e, se os dados estiverem expirados ou não existirem,
 * chama a Content API e atualiza o cache.
 * Retorna os dados da Content API (ou do cache).
 */
async function getContentFromCacheOrAPI(hotelCode) {
  // Tenta buscar no cache (tabela "hotel_content")
  const { data: cachedContent, error: dbError } = await supabase
    .from("hotel_content")
    .select("*")
    .eq("hotel_code", hotelCode)
    .single();

  const now = Date.now();
  const expireAfter = 24 * 3600 * 1000; // 24 horas

  if (cachedContent && cachedContent.last_updated && (now - new Date(cachedContent.last_updated).getTime() < expireAfter)) {
    // Dados válidos no cache
    return cachedContent.content_data;
  } else {
    // Dados não existem ou estão expirados: buscar na Content API
    const signature = generateSignature(process.env.API_KEY_HH, process.env.SECRET_KEY_HH);
    // Usando o endpoint com query "codes" mesmo para um único hotel
    const contentUrl = `${CONTENT_URL}?codes=${hotelCode}&language=ENG&fields=all`;
    const headers = {
      "Api-Key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Accept": "application/json"
    };

    const response = await fetch(contentUrl, { method: "GET", headers });
    const contentData = await response.json();
    if (!response.ok) {
      console.warn(`Erro ao buscar conteúdo para o hotel ${hotelCode}:`, contentData);
      return null;
    }

    // Atualiza ou insere no cache
    if (cachedContent) {
      await supabase
        .from("hotel_content")
        .update({
          content_data: contentData,
          last_updated: new Date().toISOString()
        })
        .eq("hotel_code", hotelCode);
    } else {
      await supabase
        .from("hotel_content")
        .insert([{
          hotel_code: hotelCode,
          content_data: contentData,
          last_updated: new Date().toISOString()
        }]);
    }
    return contentData;
  }
}

const router = Router();

router.get("/hotels", async (req, res) => {
  try {
    // 1) Ler credenciais
    const apiKey = process.env.API_KEY_HH;
    const apiSec = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSec) {
      return res.status(500).json({ error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH)." });
    }

    // 2) Gerar assinatura
    const signature = generateSignature(apiKey, apiSec);

    // 3) Ler parâmetros da query (com valores padrão)
    const { checkIn = "2025-06-15", checkOut = "2025-06-16", destination = "MCO" } = req.query;
    const roomsCount = parseInt(req.query.rooms || "1", 10);
    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const adults = parseInt(req.query[`adults${i}`] || "2", 10);
      const children = parseInt(req.query[`children${i}`] || "0", 10);
      occupancies.push({ rooms: 1, adults, children });
    }
    if (occupancies.length === 0) {
      occupancies.push({ rooms: 1, adults: 2, children: 0 });
    }

    // 4) Configurar headers e corpo para a Booking API
    const bookingHeaders = {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const bodyData = {
      stay: { checkIn, checkOut },
      occupancies,
      destination: { code: destination }
    };

    // 5) Chamar a Booking API (POST)
    const limit = 20;
    const respBooking = await fetch(`${BOOKING_URL}?limit=${limit}`, {
      method: "POST",
      headers: bookingHeaders,
      body: JSON.stringify(bodyData)
    });
    const bookingJson = await respBooking.json();
    if (!respBooking.ok) {
      return res.status(respBooking.status).json({
        error: bookingJson.error || "Erro na API Hotelbeds (Booking)",
        details: bookingJson
      });
    }

    // 6) Extrair array de hotéis da resposta da Booking API
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({ availability: bookingJson, combined: [] });
    }

    // 7) Para cada hotel, obter os dados de conteúdo (cache ou API) e combinar
    const combined = [];
    for (const hotel of hotelsArray) {
      const hotelCode = hotel.code;
      // Busca os dados de conteúdo do cache ou, se necessário, da API
      const contentData = await getContentFromCacheOrAPI(hotelCode);
      let contentResult = null;
      if (contentData && contentData.hotels && contentData.hotels[0]) {
        const ch = contentData.hotels[0];
        contentResult = {
          name: ch.name,
          description: ch.description?.content || "",
          facilities: ch.facilities || [],
          images: (ch.images || []).map(img => `https://photos.hotelbeds.com/giata/xl/${img.path}`),
          interestPoints: ch.interestPoints || []
        };
      }

      const hotelObj = {
        code: hotelCode,
        name: hotel.name,
        minRate: hotel.minRate,
        maxRate: hotel.maxRate,
        currency: hotel.currency,
        categoryCode: hotel.categoryCode,
        categoryName: hotel.categoryName,
        content: contentResult
      };

      // Upsert (insere/atualiza) os dados no cache do Supabase
      const { error } = await supabase
        .from("hotels_content")
        .upsert({
          hotel_code: hotelCode,
          name: hotel.name,
          description: contentResult ? contentResult.description : null,
          category_code: hotel.categoryCode,
          category_name: hotel.categoryName,
          currency: hotel.currency,
          content_json: contentResult,
          last_updated: new Date().toISOString()
        }, { onConflict: "hotel_code" });
      if (error) {
        console.error("Erro ao salvar o hotel no banco:", hotelCode, error);
      }
      combined.push(hotelObj);

      // Aguardar um pequeno delay para evitar rate limits
      await sleep(250);
    }

    // 8) Retornar os dados combinados (Booking + Content) para o front-end
    return res.json({
      availability: bookingJson,
      combined
    });
  } catch (err) {
    console.error("Erro em /api/hotelbeds/hotels:", err);
    return res.status(500).json({ error: "Erro interno ao buscar hotéis", message: err.message });
  }
});

router.get("/hotel-content", async (req, res) => {
  try {
    const { hotelCode } = req.query;
    if (!hotelCode) {
      return res.status(400).json({ error: "O parâmetro 'hotelCode' é obrigatório." });
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
      return res.status(response.status).json({ error: result.error || "Erro na API Hotelbeds (Content)" });
    }
    return res.json(result);
  } catch (err) {
    console.error("Erro em /api/hotelbeds/hotel-content:", err);
    return res.status(500).json({ error: "Erro interno ao buscar conteúdo detalhado do hotel", message: err.message });
  }
});

export default router;
