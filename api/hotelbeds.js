// routes/hotelbeds.routes.js
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// URLs base (teste). Em produção, troque "api.test" por "api."
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Cria cliente do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Função para gerar assinatura
function generateSignature(apiKey, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  return crypto.createHash("sha256").update(apiKey + secretKey + timestamp).digest("hex");
}

/**
 * Função para obter os dados de conteúdo de um hotel a partir do cache (Supabase)
 * ou, se não existir ou estiver expirado, faz a chamada à Content API e atualiza o cache.
 * 
 * @param {number|string} hotelCode - O código do hotel
 * @returns {Promise<Object|null>} - Retorna o conteúdo (JSON) ou null em caso de erro
 */
async function getContentFromCacheOrAPI(hotelCode) {
  // Consulta se já temos dados no cache (tabela "hotel_content")
  const { data: cachedContent, error: dbError } = await supabase
    .from("hotel_content")
    .select("*")
    .eq("hotel_code", hotelCode)
    .single();

  const now = Date.now();
  const expireAfter = 24 * 3600 * 1000; // expira em 24 horas

  if (
    cachedContent &&
    cachedContent.last_updated &&
    now - new Date(cachedContent.last_updated).getTime() < expireAfter
  ) {
    // Dados válidos no cache
    return cachedContent.content_data;
  } else {
    // Não há dados ou estão expirados: chama a Content API
    const signature = generateSignature(process.env.API_KEY_HH, process.env.SECRET_KEY_HH);
    // Para buscar um único hotel, usamos o endpoint com query "codes" (mesmo que com apenas 1 código)
    const contentUrl = `${CONTENT_URL}?codes=${hotelCode}&language=ENG&fields=all`;
    const headers = {
      "Api-Key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Accept": "application/json"
    };

    const response = await fetch(contentUrl, { method: "GET", headers });
    const contentData = await response.json();
    if (!response.ok) {
      console.warn(`Erro ao buscar content para hotel ${hotelCode}:`, contentData);
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
        .insert([
          {
            hotel_code: hotelCode,
            content_data: contentData,
            last_updated: new Date().toISOString()
          }
        ]);
    }
    return contentData;
  }
}

const router = Router();

router.get("/hotels", async (req, res) => {
  try {
    // 1) Ler credenciais do .env
    const apiKey = process.env.API_KEY_HH;
    const apiSec = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSec) {
      return res.status(500).json({ error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH)." });
    }

    // 2) Gerar assinatura
    const signature = generateSignature(apiKey, apiSec);

    // 3) Ler query params com valores padrão
    const { checkIn = "2025-06-15", checkOut = "2025-06-16", destination = "MCO" } = req.query;

    // 4) Montar o array de occupancies
    const roomsCount = parseInt(req.query.rooms || "1", 10);
    const occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const ad = parseInt(req.query[`adults${i}`] || "2", 10);
      const ch = parseInt(req.query[`children${i}`] || "0", 10);
      occupancies.push({ rooms: 1, adults: ad, children: ch });
    }
    if (occupancies.length === 0) {
      occupancies.push({ rooms: 1, adults: 2, children: 0 });
    }

    // 5) Chamada à Booking API
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
    const limit = 20;
    const respBooking = await fetch(`${BOOKING_URL}?limit=${limit}`, {
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

    // 6) Obter array de hotéis
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({ availability: bookingJson, contentRaw: null, combined: [] });
    }

    // 7) Para cada hotel, obter dados de conteúdo (do cache ou da API) e combinar
    const combined = [];
    for (const bkHotel of hotelsArray) {
      const hotelCode = bkHotel.code;
      const contentData = await getContentFromCacheOrAPI(hotelCode);

      combined.push({
        code: hotelCode,
        name: bkHotel.name,
        minRate: bkHotel.minRate,
        maxRate: bkHotel.maxRate,
        currency: bkHotel.currency,
        categoryCode: bkHotel.categoryCode,
        categoryName: bkHotel.categoryName,
        // Na propriedade "content" estamos extraindo alguns dados do primeiro hotel retornado pela Content API
        content: contentData && contentData.hotels && contentData.hotels[0]
          ? {
              name: contentData.hotels[0].name,
              description: contentData.hotels[0].description?.content || "",
              facilities: contentData.hotels[0].facilities || [],
              images: (contentData.hotels[0].images || []).map(img => ({
                path: img.path,
                type: img.type
              }))
            }
          : null
      });
    }

    // 8) Retorna a resposta para o front
    return res.json({
      availability: bookingJson,
      // Opcional: contentRaw: contentData bruto (se necessário)
      combined
    });

  } catch (err) {
    console.error("Erro /api/hotelbeds/hotels =>", err);
    return res.status(500).json({
      error: "Erro interno ao buscar Disponibilidade + Conteúdo",
      message: err.message
    });
  }
});

export default router;
