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

// URLs base (teste). Para produção, altere "api.test" para "api."
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

const router = Router();

router.get("/hotels", async (req, res) => {
  try {
    // 1) Recupera credenciais do .env
    const apiKey = process.env.API_KEY_HH;
    const apiSecret = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2) Gera assinatura
    const signature = generateSignature(apiKey, apiSecret);

    // 3) Ler query parameters (se não enviados, usa valores padrão)
    const {
      checkIn     = "2025-06-15",
      checkOut    = "2025-06-20",
      destination = "MCO"
    } = req.query;

    // 4) Monta array de occupancies de acordo com o número de quartos
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
    // (A) Chamada à Booking API (POST) para disponibilidade e preços
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

    // Extraindo a lista de hotéis da resposta do Booking API
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // --------------------------------------------------------------
    // (B) Chamada à Content API (GET) para buscar fotos e descrições
    // --------------------------------------------------------------
    const codes = hotelsArray.map(h => h.code);
    const codesCsv = codes.join(",");

    const contentHeaders = {
      "Api-Key": apiKey,
      "X-Signature": signature, // mesma chave/secret
      "Accept": "application/json"
    };

    // Exemplo de URL: .../hotel-content-api/1.0/hotels?codes=1234,5678&language=ENG&fields=all
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

    // Cria um map para lookup rápido dos dados de conteúdo
    const contentMap = {};
    (contentJson?.hotels || []).forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // --------------------------------------------------------------
    // (C) Combina os dados de disponibilidade e conteúdo
    // --------------------------------------------------------------
    const combined = hotelsArray.map(bkHotel => {
      const code = bkHotel.code;
      const contentData = contentMap[code] || null;
      return {
        code,
        name: bkHotel.name,
        categoryCode: bkHotel.categoryCode,
        categoryName: bkHotel.categoryName,
        minRate: bkHotel.minRate,
        maxRate: bkHotel.maxRate,
        currency: bkHotel.currency,
        rooms: bkHotel.rooms,
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
    // (D) Retorna a resposta final
    // --------------------------------------------------------------
    return res.json({
      availability: bookingJson,  // Resposta original do Booking API
      contentRaw: contentJson,      // Resposta original do Content API
      combined                    // Dados mesclados para o front-end
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
