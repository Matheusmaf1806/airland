//////////////////////////////////////////////////////////////
// EXEMPLO DE ROTA /api/hotelbeds/hotels
// Faz 1 chamada à Booking e 1 chamada à Content, retornando
// um array "combined" com dados de ambos.
//////////////////////////////////////////////////////////////
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

// URLs base (teste). Em produção, troque "api.test" por "api."
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Função para gerar assinatura
function generateSignature(apiKey, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToSign = `${apiKey}${secretKey}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

const router = Router();

router.get("/hotels", async (req, res) => {
  try {
    // 1) Ler credenciais do .env
    const apiKey = process.env.API_KEY_HH;
    const apiSec = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSec) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2) Gerar assinatura
    const signature = generateSignature(apiKey, apiSec);

    // 3) Ler query params (ou usar defaults)
    const {
      checkIn     = "2025-06-15",
      checkOut    = "2025-06-20",
      destination = "MCO"
    } = req.query;

    // Ex.: ?rooms=2&adults1=2&children1=0&adults2=1&children2=2
    const roomsCount = parseInt(req.query.rooms || "1", 10);
    const occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const ad = parseInt(req.query[`adults${i}`] || "2", 10);
      const ch = parseInt(req.query[`children${i}`] || "0", 10);
      occupancies.push({ rooms: 1, adults: ad, children: ch });
    }
    if (!occupancies.length) {
      occupancies.push({ rooms: 1, adults: 2, children: 0 });
    }

    // 4) Chamada à Booking API (POST)
    const bookingHeaders = {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    // Corpo do POST
    const bodyData = {
      stay: { checkIn, checkOut },
      occupancies,
      destination: { code: destination }
    };

    // Limite de resultados
    const limit = 20;

    // POST para a Booking API
    const respBooking = await fetch(`${BOOKING_URL}?limit=${limit}`, {
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

    // Array de hotéis vindos da Booking API
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // 5) Montar CSV com todos os codes => "123,456,789"
    const codes = hotelsArray.map(h => h.code);
    const codesCsv = codes.join(",");

    // 6) Fazer apenas 1 GET à Content API, passando todos os códigos
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

    // Cria um Map: contentMap[code] = dados do Content
    const contentMap = {};
    (contentJson?.hotels || []).forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // 7) Combinar Booking + Content
    const combined = hotelsArray.map(bkHotel => {
      const code   = bkHotel.code;
      const cData  = contentMap[code] || null;

      return {
        code,
        name: bkHotel.name,
        categoryCode: bkHotel.categoryCode,
        categoryName: bkHotel.categoryName,
        minRate: bkHotel.minRate,
        maxRate: bkHotel.maxRate,
        currency: bkHotel.currency,
        rooms: bkHotel.rooms,
        content: cData ? {
          // Pegando alguns campos do Content
          name: cData.name?.content || bkHotel.name,
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

    // 8) Retornar ao front-end
    return res.json({
      availability: bookingJson, // dados originais da Booking
      contentRaw: contentJson,   // dados originais da Content
      combined                   // array de objetos mesclados
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
