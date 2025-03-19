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

router.get("/hotels", async (req, res) => {
  try {
    // 1) Recupera credenciais do ambiente
    const apiKey = process.env.API_KEY_HH;
    const apiSecret = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2) Gera assinatura com base em apiKey e apiSecret
    const signature = generateSignature(apiKey, apiSecret);

    // 3) Ler query parameters (ou valores padrão)
    const {
      checkIn  = "2025-06-15",
      checkOut = "2025-06-20"
      // Notamos que não precisamos mais de "destination" nem "code"
    } = req.query;

    // 4) Montar occupancies com base em rooms e adultos/children
    const roomsCount = parseInt(req.query.rooms || "1", 10);
    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const adults = parseInt(req.query[`adults${i}`] || "2", 10);
      const children = parseInt(req.query[`children${i}`] || "0", 10);
      occupancies.push({ rooms: 1, adults, children });
    }
    if (!occupancies.length) {
      occupancies.push({ rooms: 1, adults: 2, children: 0 });
    }

    // --------------------------------------------------------------
    // (A) Chamada à Booking API (POST) => disponibilidade e preços
    // --------------------------------------------------------------
    const bookingHeaders = {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    // Monta o payload utilizando "hotels" com a estrutura desejada:
    // Em vez de enviar destination, enviamos hotels com hotel: [13621]
    const bodyData = {
      stay: { checkIn, checkOut },
      occupancies,
      hotels: { hotel: [13621] }
    };

    // Faz POST na Booking API
    const respBooking = await fetch(BOOKING_URL, {
      method: "POST",
      headers: bookingHeaders,
      body: JSON.stringify(bodyData)
    });
    const bookingJson = await respBooking.json();

    // Se a resposta não estiver ok, retorna erro
    if (!respBooking.ok) {
      return res.status(respBooking.status).json({
        error: bookingJson.error || "Erro na API Hotelbeds (Booking)",
        details: bookingJson
      });
    }

    // Array de hotéis retornados
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // --------------------------------------------------------------
    // (B) Chamada à Content API => fotos e descrições
    // --------------------------------------------------------------
    // Junta todos os "code" em uma CSV, ex: "1234,5678"
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

    // Cria um map para lookup rápido dos dados da Content API
    const contentMap = {};
    (contentJson?.hotels || []).forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // --------------------------------------------------------------
    // (C) Combina os dados de Booking e Content em um único objeto
    // --------------------------------------------------------------
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
        // Anexa os dados de conteúdo, se disponíveis
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

    // --------------------------------------------------------------
    // (D) Retorna ao front os dados combinados
    // --------------------------------------------------------------
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
