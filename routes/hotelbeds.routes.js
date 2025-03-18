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

// URLs base de teste (substituir "api.test" por "api." em produção)
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

const router = Router();

/**
 * Rota POST /api/hotelbeds/hotels
 * O corpo JSON pode ser de dois formatos:
 * 1) Para busca por destino (listagem):
 *    {
 *      "stay": { "checkIn": "YYYY-MM-DD", "checkOut": "YYYY-MM-DD" },
 *      "occupancies": [ { "rooms": X, "adults": Y, "children": Z } ],
 *      "destination": { "code": "MCO" }
 *    }
 *
 * 2) Para busca de um hotel específico (detalhes):
 *    {
 *      "stay": { "checkIn": "YYYY-MM-DD", "checkOut": "YYYY-MM-DD" },
 *      "occupancies": [ { "rooms": X, "adults": Y, "children": Z } ],
 *      "hotels": { "hotel": [ code ] }
 *    }
 */
router.post("/hotels", async (req, res) => {
  try {
    // 1) Recupera credenciais do ambiente
    const apiKey = process.env.API_KEY_HH;
    const apiSecret = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2) Gera assinatura
    const signature = generateSignature(apiKey, apiSecret);

    // 3) Lê o corpo da requisição
    const { stay = {}, occupancies = [], hotels = null, destination = null } = req.body;
    const { checkIn = "2025-06-15", checkOut = "2025-06-20" } = stay;

    // 4) Monta o bodyData a ser enviado para a Booking API
    const bodyData = {
      stay: { checkIn, checkOut },
      occupancies
    };

    // Se foi enviado o hotel específico (detalhes), usa o campo "hotels"
    if (hotels && Array.isArray(hotels.hotel)) {
      bodyData.hotels = hotels;
    } else if (destination) {
      // Caso contrário, usa o destino (listagem)
      bodyData.destination = destination;
    } else {
      // Fallback padrão: destino "MCO"
      bodyData.destination = { code: "MCO" };
    }

    // 5) Chama a Booking API
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

    // 6) Obtém o array de hotéis retornados
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // 7) Chama a Content API para obter fotos e descrições
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

    // 8) Cria um mapa de dados da Content API para lookup rápido
    const contentMap = {};
    (contentJson?.hotels || []).forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // 9) Combina os dados de Booking e Content
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

    // 10) Retorna os dados combinados ao front-end
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
