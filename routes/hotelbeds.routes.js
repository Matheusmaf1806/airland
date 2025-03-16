import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

// Função para gerar assinatura (X-Signature) igual no .env
function generateSignature(apiKey, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToSign = `${apiKey}${secret}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

// URLs base para teste. Em produção, troque "api.test" por "api."
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

const router = Router();

/**
 * GET /api/hotelbeds/hotels?checkIn=2025-06-15&checkOut=2025-06-20&destination=MCO&rooms=2&adults1=2&children1=1...
 *
 * Faz duas chamadas:
 *   1) Booking API => disponibilidade, preços
 *   2) Content API => fotos, descrições
 * Combina ambas e devolve no JSON:
 *   {
 *     availability: {...},  // response original do booking
 *     contentRaw: {...},    // response original do content
 *     combined: [
 *       {
 *         code, name, minRate, maxRate, currency,
 *         content: {
 *           name, description, categoryName, images: [...]
 *         }
 *       },
 *       ...
 *     ]
 *   }
 */
router.get("/hotels", async (req, res) => {
  try {
    // 1) Ler chaves do .env
    const apiKey    = process.env.API_KEY_HH;     // ex.: "123456"
    const apiSecret = process.env.SECRET_KEY_HH;  // ex.: "abcdef..."
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2) Ler query params do front
    const {
      checkIn     = "2025-06-15",
      checkOut    = "2025-06-16",
      destination = "MCO"
    } = req.query;

    // Montar occupancies[] de acordo com a quantidade de quartos
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
    // Se não tiver nada, fallback
    if (occupancies.length === 0) {
      occupancies.push({ rooms: 1, adults: 2, children: 0 });
    }

    // 3) Gerar assinatura e montar headers
    const signature = generateSignature(apiKey, apiSecret);

    const bookingHeaders = {
      "Api-key":      apiKey,
      "X-Signature":  signature,
      "Content-Type": "application/json",
      "Accept":       "application/json"
    };

    // 4) Chamar Booking API (/hotels) p/ disponibilidade
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
      // Erro da API de Booking
      return res.status(respBooking.status).json({
        error: bookingJson.error || "Erro na API Hotelbeds (Booking)",
        details: bookingJson
      });
    }

    // Array de hotéis do booking
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      // Se nenhum hotel, retorna cedo
      return res.json({
        availability: bookingJson,
        combined: []
      });
    }

    // 5) Extrair codes p/ chamar Content API
    const codes = hotelsArray.map(h => h.code);
    const codesCsv = codes.join(",");

    // 6) Chamar Content API
    const contentHeaders = {
      "Api-Key":      apiKey,
      "X-Signature":  signature,
      "Accept":       "application/json"
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

    // Monta map {hotelCode => dadosContent}
    const contentHotels = contentJson?.hotels || [];
    let contentMap = {};
    contentHotels.forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // 7) Combinar
    const combined = hotelsArray.map((bkHotel) => {
      const code = bkHotel.code;
      const contentData = contentMap[code] || null;
      return {
        code,
        name:         bkHotel.name,
        categoryCode: bkHotel.categoryCode,
        categoryName: bkHotel.categoryName,
        currency:     bkHotel.currency,
        minRate:      bkHotel.minRate,
        maxRate:      bkHotel.maxRate,
        rooms:        bkHotel.rooms,
        // Conteúdo
        content: contentData ? {
          name:         contentData.name,
          description:  contentData.description?.content || "",
          categoryName: contentData.categoryName,
          images: (contentData.images || []).map(img => ({
            path: img.path,
            type: img.type
          }))
        } : null
      };
    });

    // 8) Retorna
    return res.json({
      availability: bookingJson,  // a resposta original do /hotels
      contentRaw:   contentJson,  // a resposta bruta do content API (opcional)
      combined
    });

  } catch (err) {
    console.error("Erro /api/hotelbeds/hotels =>", err);
    return res.status(500).json({
      error: "Erro interno ao buscar Disponibilidade + Conteúdo"
    });
  }
});

export default router;
