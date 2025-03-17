// routes/hotelbeds.routes.js
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Configura o Supabase (verifique as variáveis de ambiente)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

function generateSignature(apiKey, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  return crypto.createHash("sha256").update(apiKey + secretKey + timestamp).digest("hex");
}

// Função para aguardar (delay)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

    // 3) Ler parâmetros da query
    const { checkIn = "2025-06-15", checkOut = "2025-06-16", destination = "MCO" } = req.query;
    const roomsCount = parseInt(req.query.rooms || "1", 10);

    // 4) Montar o array de occupancies
    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const adults = parseInt(req.query[`adults${i}`] || "2", 10);
      const children = parseInt(req.query[`children${i}`] || "0", 10);
      occupancies.push({ rooms: 1, adults, children });
    }
    if (occupancies.length === 0) {
      occupancies.push({ rooms: 1, adults: 2, children: 0 });
    }

    // 5) Configurar headers e corpo para Booking API
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

    // Definir limite de resultados (ex.: 20)
    const limit = 20;

    // 6) Chamada à Booking API
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

    // Array de hotéis da Booking API
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // 7) Processar cada hotel individualmente:
    const combined = [];
    for (const hotel of hotelsArray) {
      try {
        // Buscar conteúdo para o hotel via Content API
        const contentResp = await fetch(
          `${CONTENT_URL}?codes=${hotel.code}&language=ENG&fields=all`,
          {
            method: "GET",
            headers: {
              "Api-Key": apiKey,
              "X-Signature": signature,
              "Accept": "application/json"
            }
          }
        );

        let content = {};
        if (contentResp.ok) {
          const contentJson = await contentResp.json();
          // Supondo que o resultado vem como array, busca o hotel correto
          content = contentJson?.hotels ? contentJson.hotels.find(ch => ch.code === hotel.code) || {} : {};
        } else {
          console.warn("Falha ao buscar content para o hotel:", hotel.code);
        }

        // Preparar o objeto final a ser salvo no banco
        const hotelObj = {
          code: hotel.code,
          name: hotel.name,
          categoryCode: hotel.categoryCode,
          categoryName: hotel.categoryName,
          minRate: hotel.minRate,
          maxRate: hotel.maxRate,
          currency: hotel.currency,
          rooms: hotel.rooms,
          // Dados de conteúdo
          content: {
            name: content.name?.content || hotel.name,
            description: content.description?.content || "",
            categoryName: content.categoryName,
            facilities: (content.facilities || []).map(f => f.description?.content || ""),
            images: (content.images || []).map(img => `https://photos.hotelbeds.com/giata/xl/${img.path}`),
            interestPoints: (content.interestPoints || []).map(ip => ({
              poiName: ip.poiName || "Ponto de Interesse",
              distance: ip.distance || "0"
            }))
          }
        };

        // Insere ou atualiza o hotel no banco de dados (Supabase)
        const { data, error } = await supabase
          .from("hotels")
          .upsert(hotelObj, { onConflict: "code" }); // "code" é a chave única

        if (error) {
          console.error("Erro ao salvar hotel no banco:", hotel.code, error);
        } else {
          console.log("Hotel salvo:", hotel.code);
        }

        combined.push(hotelObj);
      } catch (innerError) {
        console.error("Erro ao processar hotel:", hotel.code, innerError);
        combined.push({ ...hotel, content: null });
      }
      // Aguardar 250ms para cada chamada da Content API
      await sleep(250);
    }

    // 8) Retornar a resposta final (incluindo os hotéis processados e salvos)
    return res.json({
      availability: bookingJson,
      contentRaw: null, // Não precisamos retornar o raw da Content API
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
