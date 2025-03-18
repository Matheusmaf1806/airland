// api/hotelbeds.js
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

// Função que implementa timeout usando Promise.race
function fetchWithTimeout(url, options = {}, timeout = 30000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout reached")), timeout)
    )
  ]);
}

// Função auxiliar para sleep (delay)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

    // 3) Ler parâmetros da query com valores padrão
    const { checkIn = "2025-06-15", checkOut = "2025-06-16", destination = "MCO" } = req.query;
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
    const limit = 20;

    // 5) Fazer chamada à Booking API com timeout (30s)
    let respBooking;
    try {
      respBooking = await fetchWithTimeout(`${BOOKING_URL}?limit=${limit}`, {
        method: "POST",
        headers: bookingHeaders,
        body: JSON.stringify(bodyData)
      }, 30000); // 30 segundos de timeout
    } catch (err) {
      if (err.message === "Timeout reached") {
        return res.status(504).json({ error: "Booking API Timeout: a chamada demorou demais." });
      }
      throw err;
    }
    const bookingJson = await respBooking.json();
    if (!respBooking.ok) {
      return res.status(respBooking.status).json({
        error: bookingJson.error || "Erro na API (Booking)",
        details: bookingJson
      });
    }

    // 6) Extrair array de hotéis
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({ availability: bookingJson, contentRaw: null, combined: [] });
    }

    // 7) Para cada hotel, buscar dados de conteúdo (usando cache no Supabase)
    const combined = [];
    for (const bkHotel of hotelsArray) {
      const hotelCode = bkHotel.code;
      // Busca o conteúdo no cache ou atualiza se estiver expirado
      const contentData = await getContentFromCacheOrAPI(hotelCode);
      combined.push({
        code: hotelCode,
        name: bkHotel.name,
        minRate: bkHotel.minRate,
        maxRate: bkHotel.maxRate,
        currency: bkHotel.currency,
        categoryCode: bkHotel.categoryCode,
        categoryName: bkHotel.categoryName,
        content: contentData && contentData.hotels && contentData.hotels[0]
          ? {
              name: contentData.hotels[0].name,
              description: contentData.hotels[0].description?.content || "",
              facilities: contentData.hotels[0].facilities || [],
              images: (contentData.hotels[0].images || []).map(img => `https://photos.hotelbeds.com/giata/xl/${img.path}`)
            }
          : null
      });
      // Aguarda um pouco para evitar sobrecarga na Content API
      await sleep(250);
    }

    // 8) Retornar resposta ao front (a resposta usa cache para a Content API)
    return res.json({
      availability: bookingJson,
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

// Função para buscar conteúdo no cache ou via Content API e atualizar o cache
async function getContentFromCacheOrAPI(hotelCode) {
  // Consulta no Supabase (tabela "hotels_content")
  const { data: cachedContent, error: dbError } = await supabase
    .from("hotels_content")
    .select("*")
    .eq("hotel_code", hotelCode)
    .single();

  const now = Date.now();
  const expireAfter = 24 * 3600 * 1000; // 24 horas
  if (cachedContent && cachedContent.last_updated && now - new Date(cachedContent.last_updated).getTime() < expireAfter) {
    return cachedContent.content_data;
  } else {
    // Chamada à Content API para obter dados atualizados
    const signature = generateSignature(process.env.API_KEY_HH, process.env.SECRET_KEY_HH);
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
        .from("hotels_content")
        .update({
          content_data: contentData,
          last_updated: new Date().toISOString()
        })
        .eq("hotel_code", hotelCode);
    } else {
      await supabase
        .from("hotels_content")
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

export default router;
