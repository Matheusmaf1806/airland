////////////////////////////////////////////////////////////////////////
// routes/hotelbeds.routes.js
////////////////////////////////////////////////////////////////////////
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

// ---------------------------------------------------------------------
// Gera assinatura (igual para Booking e Content) - ou use duas se forem chaves diferentes
function generateSignature(apiKey, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToSign = `${apiKey}${secret}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

// URLS base (teste). Se for produção, troque "api.test" por "api."
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

const router = Router();

/**
 * GET /api/hotelbeds/hotels?checkIn=2025-06-15&checkOut=2025-06-20&destination=MCO&rooms=1&adults1=2&...
 *
 * 1) Faz POST na Booking API (/hotels) p/ obter disponibilidade e preços
 * 2) Extrai a lista de hotelCodes
 * 3) Faz GET na Content API (/hotel-content-api?codes=...) p/ buscar fotos e descrições
 * 4) Combina tudo e devolve no front no formato:
 *    {
 *      availability: {...},  // Resposta original do Booking
 *      contentRaw:   {...},  // Resposta original do Content
 *      combined: [... ]      // array mesclado
 *    }
 */
router.get("/hotels", async (req, res) => {
  try {
    // 1) Pega credenciais do .env
    const apiKey    = process.env.API_KEY_HH;
    const apiSecret = process.env.SECRET_KEY_HH;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2) Gera assinatura
    const signature = generateSignature(apiKey, apiSecret);

    // 3) Ler query params
    //    Ex: ?checkIn=2025-06-15&checkOut=2025-06-20&destination=MCO&rooms=1&adults1=2...
    const {
      checkIn     = "2025-06-15",
      checkOut    = "2025-06-20",
      destination = "MCO"
    } = req.query;

    // Montar array de occupancies
    const roomsCount = parseInt(req.query.rooms || "1", 10);
    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const ad = parseInt(req.query[`adults${i}`]   || "2", 10);
      const ch = parseInt(req.query[`children${i}`] || "0", 10);

      occupancies.push({
        rooms: 1,
        adults: ad,
        children: ch
      });
    }
    if (occupancies.length === 0) {
      occupancies.push({ rooms:1, adults:2, children:0 });
    }

    // --------------------------------------------------------------
    // (A) CHAMAR Booking API via POST
    // --------------------------------------------------------------
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

    const respBooking = await fetch(BOOKING_URL, {
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

    // Ex.: bookingJson.hotels.hotels => array de hoteis
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      // Se não tem hotéis, devolve rápido
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // Pega lista de codes p/ chamar Content
    const codes = hotelsArray.map(h => h.code);
    const codesCsv = codes.join(",");

    // --------------------------------------------------------------
    // (B) CHAMAR Content API via GET
    // --------------------------------------------------------------
    const contentHeaders = {
      "Api-Key": apiKey,
      "X-Signature": signature, // se for a mesma key/secret
      "Accept": "application/json"
    };
    // Ex.: GET https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels?codes=1234,5678&language=ENG&fields=all
    const contentUrl = `${CONTENT_URL}?codes=${codesCsv}&language=ENG&fields=all`;

    const respContent = await fetch(contentUrl, {
      method: "GET",
      headers: contentHeaders
    });
    const contentJson = await respContent.json();

    if (!respContent.ok) {
      return res.status(respContent.status).json({
        error: contentJson.error || "Erro na API Hotelbeds (Content)",
        details: contentJson
      });
    }
    // contentJson.hotels => array de hoteis com imagens/descrição
    const contentHotels = contentJson?.hotels || [];

    // Transforma em Map p/ lookup
    const contentMap = {};
    contentHotels.forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // --------------------------------------------------------------
    // (C) COMBINAR as duas fontes
    // --------------------------------------------------------------
    const combined = hotelsArray.map((bkHotel) => {
      const code = bkHotel.code;
      const contentData = contentMap[code] || null; // se não achar no content, null

      return {
        code,
        // Dados de disponibilidade
        name: bkHotel.name,
        categoryCode: bkHotel.categoryCode,
        categoryName: bkHotel.categoryName,
        minRate: bkHotel.minRate,
        maxRate: bkHotel.maxRate,
        currency: bkHotel.currency,
        rooms: bkHotel.rooms,

        // Dados de conteúdo
        content: contentData ? {
          name: contentData.name,
          description: contentData.description?.content || "",
          categoryName: contentData.categoryName,
          images: (contentData.images || []).map(img => ({
            path: img.path,
            type: img.type
          }))
        } : null
      };
    });

    // --------------------------------------------------------------
    // (D) Retornar a resposta final
    // --------------------------------------------------------------
    return res.json({
      availability: bookingJson,  // a resposta original do booking
      contentRaw: contentJson,    // a resposta original do content
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
