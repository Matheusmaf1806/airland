////////////////////////////////////////////////////////////////////////
// hotelbeds.routes.js
// Rota que combina Disponibilidade + Conteúdo (fotos/descrições) numa só chamada
////////////////////////////////////////////////////////////////////////
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

// A) Gera assinatura para X-Signature (Booking e Content usam o mesmo método)
function generateSignature(apiKey, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToSign = `${apiKey}${secret}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

// B) URLs base de teste (sandbox). Em produção, troque "api.test" por "api."
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Cria o router Express
const router = Router();

/**
 * GET /api/hotelbeds/hotels?checkIn=2025-06-15&checkOut=2025-06-20&destination=MCO&rooms=1&adults1=2...
 *
 * Faz 2 chamadas:
 * 1) POST na Booking API (/hotels) p/ obter disponibilidade e preços
 * 2) GET na Content API (/hotel-content-api) p/ buscar fotos e descrições
 * 3) Combina tudo e devolve no campo "combined"
 */
router.get("/hotels", async (req, res) => {
  try {
    // 1) Ler chaves do .env
    const apiKey    = process.env.API_KEY_HH;    
    const apiSecret = process.env.SECRET_KEY_HH; 
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2) Gerar a assinatura (vale p/ Booking e Content)
    const signature = generateSignature(apiKey, apiSecret);

    // 3) Ler query params do front (ex.: checkIn, checkOut, destination, rooms, etc.)
    const {
      checkIn     = "2025-06-15",
      checkOut    = "2025-06-20",
      destination = "MCO"
    } = req.query;

    // Monta array de occupancies de acordo com "rooms" e adults/children
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

    // -----------------------------------------------------
    // 4) POST /hotels (Booking API) para disponibilidade
    // -----------------------------------------------------
    const bookingHeaders = {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const bodyData = {
      stay: {
        checkIn,
        checkOut
      },
      occupancies,
      destination: {
        code: destination
      }
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

    // bookingJson.hotels.hotels => array de hotéis
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      // Se não há hotéis, já devolve
      return res.json({
        availability: bookingJson,
        combined: []
      });
    }

    // -----------------------------------------------------
    // 5) GET /hotel-content-api p/ buscar fotos e descrições
    // -----------------------------------------------------
    // Pega lista de codes [1234, 5678...]
    const codes = hotelsArray.map(h => h.code);
    const codesCsv = codes.join(",");

    const contentHeaders = {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Accept": "application/json"
    };

    // Exemplo: language=ENG, fields=all
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

    // contentJson.hotels => array com dados (imagens, descrições etc.)
    const contentHotels = contentJson?.hotels || [];

    // Transforma em map p/ lookup rápido: { [hotelCode]: { ...conteúdo... } }
    let contentMap = {};
    contentHotels.forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // -----------------------------------------------------
    // 6) Combina as duas fontes num array "combined"
    // -----------------------------------------------------
    const combined = hotelsArray.map((bkHotel) => {
      const code = bkHotel.code;
      const contentData = contentMap[code] || null;

      return {
        code,
        // Dados da parte de disponibilidade
        name: bkHotel.name,
        categoryCode: bkHotel.categoryCode,
        categoryName: bkHotel.categoryName,
        minRate: bkHotel.minRate,
        maxRate: bkHotel.maxRate,
        currency: bkHotel.currency,
        rooms: bkHotel.rooms, // array de rooms/rates

        // Dados de conteúdo (descrição, imagens, etc.)
        content: contentData
          ? {
              name: contentData.name,
              description: contentData.description?.content,
              categoryName: contentData.categoryName,
              images: (contentData.images || []).map(img => ({
                path: img.path,
                type: img.type
              }))
            }
          : null
      };
    });

    // -----------------------------------------------------
    // 7) Retorna ao front
    // -----------------------------------------------------
    return res.json({
      availability: bookingJson,  // a resposta original do booking
      contentRaw: contentJson,    // opcional
      combined                    // array final unificado
    });

  } catch (err) {
    console.error("Erro /api/hotelbeds/hotels =>", err);
    return res.status(500).json({ error: "Erro interno ao buscar Disponibilidade + Conteúdo" });
  }
});

// Exporta o router
export default router;
