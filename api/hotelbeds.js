// routes/hotelbeds.routes.js
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

// URLS base (teste). Em produção, troque "api.test" por "api."
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

function generateSignature(apiKey, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  return crypto
    .createHash("sha256")
    .update(apiKey + secretKey + timestamp)
    .digest("hex");
}

const router = Router();

router.get("/hotels", async (req, res) => {
  try {
    // 1) Ler credenciais do .env
    const apiKey = process.env.API_KEY_HH;     // Booking e Content (mesma credencial)
    const apiSec = process.env.SECRET_KEY_HH; 

    if (!apiKey || !apiSec) {
      return res.status(500).json({ error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH)." });
    }

    // 2) Gerar assinatura
    const signature = generateSignature(apiKey, apiSec);

    // 3) Ler query params
    //    Ex: ?checkIn=2025-06-15&checkOut=2025-06-20&destination=MCO&rooms=1&adults1=2...
    const {
      checkIn = "2025-06-15",
      checkOut = "2025-06-16",
      destination = "MCO"
    } = req.query;

    // Montar occupancies (ex.: se rooms=2, adult1=2, child1=0, adult2=2, child2=1)
    const roomsCount = parseInt(req.query.rooms || "1", 10);
    const occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const ad = parseInt(req.query[`adults${i}`]   || "2", 10);
      const ch = parseInt(req.query[`children${i}`] || "0", 10);
      occupancies.push({ rooms: 1, adults: ad, children: ch });
    }
    if (occupancies.length === 0) {
      occupancies.push({ rooms:1, adults:2, children:0 });
    }

    // 4) Fazer POST na Booking API (/hotels) p/ disponibilidade
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
        error: bookingJson.error || "Erro na API (Booking)",
        details: bookingJson
      });
    }

    // bookingJson.hotels.hotels => array de hoteis
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      // Se não tem hotéis, devolve rápido
      return res.json({
        availability: bookingJson, 
        contentRaw: null, 
        combined: []
      });
    }

    // 5) Montar lista de codes p/ chamar a Content API
    const codes = hotelsArray.map(h => h.code);
    const codesCsv = codes.join(",");

    // 6) GET na Content API p/ buscar descrições/fotos
    const contentHeaders = {
      "Api-Key": apiKey,
      "X-Signature": signature,
      "Accept": "application/json"
    };
    // Exemplo de URL: GET /hotel-content-api/1.0/hotels?codes=123,456&language=ENG&fields=all
    const contentUrl = `${CONTENT_URL}?codes=${codesCsv}&language=ENG&fields=all`;

    const respContent = await fetch(contentUrl, {
      method: "GET",
      headers: contentHeaders
    });
    const contentJson = await respContent.json();
    if (!respContent.ok) {
      return res.status(respContent.status).json({
        error: contentJson.error || "Erro na API (Content)",
        details: contentJson
      });
    }

    const contentHotels = contentJson?.hotels || [];

    // Mapear p/ lookup rápido
    const contentMap = {};
    contentHotels.forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // 7) Combinar as duas fontes
    const combined = hotelsArray.map((bk) => {
      const cData = contentMap[bk.code] || null;
      return {
        code: bk.code,
        // Disponibilidade
        name: bk.name,
        minRate: bk.minRate,
        maxRate: bk.maxRate,
        currency: bk.currency,
        categoryCode: bk.categoryCode,
        categoryName: bk.categoryName,
        // Conteúdo
        content: cData ? {
          name: cData.name,
          categoryName: cData.categoryName,
          description: cData.description?.content || "",
          images: (cData.images || []).map(img => ({
            path: img.path,
            type: img.type
          }))
        } : null
      };
    });

    // 8) Retorna o JSON ao front
    return res.json({
      availability: bookingJson,  // Resposta original do /hotels
      contentRaw: contentJson,    // Resposta original do /hotel-content-api
      combined                   // Array final com merges
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
