////////////////////////////////////////////////////////////////////////
// routes/hotelbeds.routes.js
////////////////////////////////////////////////////////////////////////
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

// Função para gerar a assinatura para Booking e Content API
function generateSignature(apiKey, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToSign = `${apiKey}${secret}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

// URLs base (substituir "api.test" por "api." em produção)
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

const router = Router();

/**
 * Rota POST /api/hotelbeds/hotels
 * Espera no body JSON:
 * {
 *   "stay": { "checkIn": "YYYY-MM-DD", "checkOut": "YYYY-MM-DD" },
 *   "occupancies": [ { "rooms": X, "adults": Y, "children": Z } ],
 *   "hotels": { "hotel": [ code ] }
 *   // ou, se não vier "hotels", virá "destination": { code: "MCO" }
 * }
 */
router.post("/hotels", async (req, res) => {
  try {
    // 1) Credenciais do ambiente
    const apiKey = process.env.API_KEY_HH;
    const apiSecret = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2) Gera assinatura
    const signature = generateSignature(apiKey, apiSecret);

    // 3) Lê o JSON do body
    const {
      stay = {},
      occupancies = [],
      hotels = null,
      destination = null
    } = req.body;

    // stay.checkIn, stay.checkOut
    const { checkIn = "2025-06-15", checkOut = "2025-06-20" } = stay;

    // Monta o bodyData que vai para a Booking API
    const bodyData = {
      stay: { checkIn, checkOut },
      occupancies
    };

    // Se veio "hotels.hotel", usa para filtrar hotel específico
    if (hotels && Array.isArray(hotels.hotel)) {
      bodyData.hotels = hotels;
    } else if (destination) {
      // Caso contrário, se veio "destination", usa
      bodyData.destination = destination;
    } else {
      // fallback
      bodyData.destination = { code: "MCO" };
    }

    // 4) Faz POST na Booking API
    const bookingHeaders = {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
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

    // 5) Array de hotéis
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // 6) Chamada à Content API => fotos e descrições
    const codes = hotelsArray.map(h => h.code);
    const codesCsv = codes.join(",");

    const contentHeaders = {
      "Api-Key": apiKey,
      "X-Signature": signature,
      "Accept": "application/json"
    };
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

    // Mapeia
    const contentMap = {};
    (contentJson?.hotels || []).forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // 7) Combina
    const combined = hotelsArray.map(bkHotel => {
      const code = bkHotel.code;
      const cData = contentMap[code] || null;
      return {
        code,
        name: bkHotel.name,
        categoryCode: bkHotel.categoryCode,
        categoryName: bkHotel.categoryName,
        minRate: bkHotel.minRate,
        maxRate: bkHotel.maxRate,
        currency: bkHotel.currency,
        destinationName: bkHotel.destinationName,
        latitude: bkHotel.latitude,
        longitude: bkHotel.longitude,
        rooms: bkHotel.rooms,
        content: cData ? {
          name: cData.name,
          description: cData.description?.content || "",
          facilities: cData.facilities || [],
          images: (cData.images || []).map(img => ({
            path: img.path,
            type: img.type
          })),
          interestPoints: cData.interestPoints || []
        } : null
      };
    });

    // 8) Retorna
    return res.json({
      availability: bookingJson,
      contentRaw: contentJson,
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
