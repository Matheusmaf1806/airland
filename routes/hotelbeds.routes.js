////////////////////////////////////////////////////////////////////////
// routes/hotelbeds.routes.js
////////////////////////////////////////////////////////////////////////
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

/**
 * Gera a assinatura (signature) exigida pela Hotelbeds:
 *  - Usa (apiKey + secret + timestamp) em SHA256
 */
function generateSignature(apiKey, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToSign = `${apiKey}${secret}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

/**
 * URLs de teste (troque "api.test" por "api." em produção).
 */
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

/**
 * Cria o router do Express para /api/hotelbeds
 */
const router = Router();

/**
 * POST /api/hotelbeds/hotels
 *
 * Espera receber no body JSON algo como:
 * {
 *   "stay": {
 *     "checkIn": "2025-06-15",
 *     "checkOut": "2025-06-20"
 *   },
 *   "occupancies": [
 *     { "rooms": 1, "adults": 2, "children": 0 }
 *   ],
 *   "hotels": {
 *     "hotel": [ 12345 ]
 *   }
 *   // OU, se não tiver "hotels", usar "destination": { code: "MCO" }
 * }
 */
router.post("/hotels", async (req, res) => {
  try {
    // 1) Carrega credenciais do ambiente (.env)
    const apiKey = process.env.API_KEY_HH;     // Ex.: "xxx"
    const apiSecret = process.env.SECRET_KEY_HH; // Ex.: "yyy"
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH)."
      });
    }

    // 2) Gera a signature requerida pela Hotelbeds
    const signature = generateSignature(apiKey, apiSecret);

    // 3) Extrai o body enviado pelo front-end
    //    Exemplo:
    //    {
    //      stay: { checkIn: "2025-06-15", checkOut: "2025-06-20" },
    //      occupancies: [ { rooms:1, adults:2, children:0 } ],
    //      hotels: { hotel: [ 12345 ] }
    //    }
    const { stay, occupancies, hotels, destination } = req.body || {};
    if (!stay) {
      return res.status(400).json({ error: "Body inválido: falta 'stay' com checkIn/checkOut." });
    }
    const { checkIn = "2025-06-15", checkOut = "2025-06-20" } = stay;

    // 4) Monta o bodyData para chamar a Booking API
    const bodyData = {
      stay: { checkIn, checkOut },
      occupancies: occupancies || []
    };
    // Se "hotels" veio no body, usamos como filtro de hotel(es). Senão, se veio "destination", usamos destino.
    if (hotels && hotels.hotel?.length) {
      bodyData.hotels = hotels;
    } else if (destination) {
      bodyData.destination = destination;
    } else {
      // fallback: se não veio nada, define "MCO"
      bodyData.destination = { code: "MCO" };
    }

    // 5) Faz POST na Booking API
    const bookingHeaders = {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    const bookingResp = await fetch(BOOKING_URL, {
      method: "POST",
      headers: bookingHeaders,
      body: JSON.stringify(bodyData)
    });
    const bookingJson = await bookingResp.json();
    if (!bookingResp.ok) {
      return res.status(bookingResp.status).json({
        error: bookingJson.error || "Erro na API Hotelbeds (Booking)",
        details: bookingJson
      });
    }

    // 6) Se não retornou nenhum hotel, não chamamos a Content API
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // 7) Junta todos os "code" em CSV "123,456" para chamar Content
    const codes = hotelsArray.map(h => h.code);
    const codesCsv = codes.join(",");

    // 8) Faz GET na Content API para buscar fotos e descrições
    const contentSignature = generateSignature(apiKey, apiSecret); // se quiser gerar novamente
    const contentHeaders = {
      "Api-Key": apiKey,
      "X-Signature": contentSignature,
      "Accept": "application/json"
    };
    // Exemplo: GET /hotel-content-api/1.0/hotels?codes=1234,5678&language=ENG&fields=all
    const contentUrl = `${CONTENT_URL}?codes=${codesCsv}&language=ENG&fields=all`;
    const contentResp = await fetch(contentUrl, {
      method: "GET",
      headers: contentHeaders
    });
    const contentJson = await contentResp.json();
    if (!contentResp.ok) {
      return res.status(contentResp.status).json({
        error: contentJson.error || "Erro na API Hotelbeds (Content)",
        details: contentJson
      });
    }

    // 9) Mapeia o resultado da Content API para lookup rápido
    const contentMap = {};
    (contentJson?.hotels || []).forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // 10) Combina booking + content
    const combined = hotelsArray.map(bk => {
      const code = bk.code;
      const cData = contentMap[code] || null;
      return {
        code,
        name: bk.name,
        categoryCode: bk.categoryCode,
        minRate: bk.minRate,
        maxRate: bk.maxRate,
        currency: bk.currency,
        latitude: bk.latitude,
        longitude: bk.longitude,
        rooms: bk.rooms,
        content: cData // se não tiver, será null
      };
    });

    // 11) Retorna o JSON mesclado
    return res.json({
      availability: bookingJson,  // Dados crus da Booking API
      contentRaw: contentJson,    // Dados crus da Content API
      combined                   // Array final
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
