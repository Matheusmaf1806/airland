// routes/hotelbeds.routes.js
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Função para gerar assinatura (usada tanto para Booking quanto para Content API)
function generateSignature(apiKey, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  return crypto
    .createHash("sha256")
    .update(apiKey + secretKey + timestamp)
    .digest("hex");
}

// Função de delay (sleep) em milissegundos
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const router = Router();

router.get("/hotels", async (req, res) => {
  try {
    // 1) Recupera credenciais do .env
    const apiKey = process.env.API_KEY_HH;
    const apiSec = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSec) {
      return res.status(500).json({ error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH)." });
    }

    // 2) Gera assinatura
    const signature = generateSignature(apiKey, apiSec);

    // 3) Ler query params com valores padrão
    const { checkIn = "2025-06-15", checkOut = "2025-06-16", destination = "MCO" } = req.query;
    const roomsCount = parseInt(req.query.rooms || "1", 10);

    // 4) Montar array de occupancies (ex.: para 1 quarto, 2 adultos, 0 crianças por padrão)
    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const adults = parseInt(req.query[`adults${i}`] || "2", 10);
      const children = parseInt(req.query[`children${i}`] || "0", 10);
      occupancies.push({ rooms: 1, adults, children });
    }
    if (occupancies.length === 0) {
      occupancies.push({ rooms: 1, adults: 2, children: 0 });
    }

    // 5) Configurar headers e corpo para chamada à Booking API
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

    // Limite de resultados
    const limit = 20;

    // 6) Chamada POST à Booking API para obter disponibilidade e preços
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

    // Array de hotéis retornados da Booking API
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // 7) Para cada hotel, chamar a Content API com delay para evitar sobrecarga
    const combined = [];
    for (const hotel of hotelsArray) {
      try {
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
          // Como a Content API pode retornar um array, assumimos que o hotel está em contentJson.hotels[0]
          content = contentJson?.hotels ? contentJson.hotels.find(ch => ch.code === hotel.code) || {} : {};
        } else {
          console.warn("Falha ao buscar content do hotel:", hotel.code);
        }

        // Combinar os dados do hotel da Booking API com os dados do Content API
        const hotelObj = {
          code: hotel.code,
          name: hotel.name,
          categoryCode: hotel.categoryCode,
          categoryName: hotel.categoryName,
          minRate: hotel.minRate,
          maxRate: hotel.maxRate,
          currency: hotel.currency,
          rooms: hotel.rooms,
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

        combined.push(hotelObj);
      } catch (error) {
        console.error("Erro ao processar content do hotel:", hotel.code, error);
        combined.push({
          ...hotel,
          content: null
        });
      }
      // Aguardar 250ms entre as requisições de Content API (4 requisições/s)
      await sleep(250);
    }

    // 8) Retornar a resposta combinada ao front-end
    return res.json({
      availability: bookingJson,
      // Não retornamos o raw da content API para cada hotel, apenas o merge final
      contentRaw: null,
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
