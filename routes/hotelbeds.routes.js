////////////////////////////////////////////////////////////////////////
// hotelbeds.routes.js
// Esta rota realiza duas requisições:
// 1) POST na Booking API para obter disponibilidade e preços.
// 2) GET na Content API para obter conteúdo detalhado (fotos, descrição etc.).
// Em seguida, combina as duas respostas e retorna para o front.
////////////////////////////////////////////////////////////////////////

import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

// Função para gerar assinatura para X-Signature (usada para Booking e Content API)
function generateSignature(apiKey, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToSign = `${apiKey}${secret}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

// URLs base para teste/sandbox. Em produção, troque "api.test" por "api."
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Cria o router Express
const router = Router();

/**
 * GET /api/hotelbeds/hotels?checkIn=2025-06-15&checkOut=2025-06-16&destination=MCO&rooms=1&adults1=2...
 *
 * 1) Faz POST na Booking API (/hotels) para obter disponibilidade e preços.
 * 2) Extrai a lista de hotel codes.
 * 3) Faz GET na Content API (/hotel-content-api?codes=...) para buscar conteúdo detalhado.
 * 4) Combina os dados e retorna ao front.
 */
router.get("/hotels", async (req, res) => {
  try {
    // 1) Ler credenciais do ambiente
    const apiKey = process.env.API_KEY_HH;
    const apiSecret = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2) Gerar assinatura
    const signature = generateSignature(apiKey, apiSecret);

    // 3) Ler parâmetros da query; se não enviados, usar valores default
    const { checkIn = "2025-06-15", checkOut = "2025-06-20", destination = "MCO" } = req.query;

    // 4) Montar array de ocupâncias com base no número de quartos
    const roomsCount = parseInt(req.query.rooms || "1", 10);
    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const adults = parseInt(req.query[`adults${i}`] || "2", 10);
      const children = parseInt(req.query[`children${i}`] || "0", 10);
      occupancies.push({ rooms: 1, adults, children });
    }
    if (occupancies.length === 0) {
      occupancies.push({ rooms: 1, adults: 2, children: 0 });
    }

    // 5) Requisição POST na Booking API para obter disponibilidade e preços
    const bookingHeaders = {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const bookingBody = {
      stay: { checkIn, checkOut },
      occupancies,
      destination: { code: destination }
    };

    const bookingResponse = await fetch(BOOKING_URL, {
      method: "POST",
      headers: bookingHeaders,
      body: JSON.stringify(bookingBody)
    });
    const bookingData = await bookingResponse.json();
    if (!bookingResponse.ok) {
      return res.status(bookingResponse.status).json({
        error: bookingData.error || "Erro na API Hotelbeds (Booking)",
        details: bookingData
      });
    }

    // 6) Obter a lista de hotéis da resposta
    const hotelsArray = bookingData?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingData,
        combined: []
      });
    }

    // 7) Obter a lista de códigos para buscar conteúdo
    const codes = hotelsArray.map(hotel => hotel.code);
    const codesCsv = codes.join(",");

    // 8) Requisição GET na Content API para buscar imagens, descrições etc.
    const contentHeaders = {
      "Api-Key": apiKey,
      "X-Signature": signature,
      "Accept": "application/json"
    };
    // URL com parâmetros: códigos, idioma e fields=all (todos os campos)
    const contentUrl = `${CONTENT_URL}?codes=${codesCsv}&language=ENG&fields=all`;

    const contentResponse = await fetch(contentUrl, {
      method: "GET",
      headers: contentHeaders
    });
    const contentData = await contentResponse.json();
    if (!contentResponse.ok) {
      return res.status(contentResponse.status).json({
        error: contentData.error || "Erro na API Hotelbeds (Content)",
        details: contentData
      });
    }

    // 9) Transformar o conteúdo em um mapa para consulta rápida (por código)
    let contentMap = {};
    const contentHotels = contentData?.hotels || [];
    contentHotels.forEach(item => {
      contentMap[item.code] = item;
    });

    // 10) Combinar os dados de disponibilidade (booking) com os dados de conteúdo
    const combined = hotelsArray.map(bkHotel => {
      const code = bkHotel.code;
      const content = contentMap[code] || null;
      return {
        code,
        name: bkHotel.name,
        currency: bkHotel.currency,
        minRate: bkHotel.minRate,
        maxRate: bkHotel.maxRate,
        rooms: bkHotel.rooms,
        content: content
          ? {
              name: content.name,
              description: content.description ? content.description.content : "",
              categoryName: content.categoryName,
              images: (content.images || []).map(img => ({
                path: img.path,
                type: img.type
              })),
              address: content.address ? content.address.content : ""
            }
          : null
      };
    });

    // 11) Retornar a resposta combinada ao front-end
    return res.json({
      availability: bookingData,
      contentRaw: contentData,
      combined
    });
  } catch (err) {
    console.error("Erro /api/hotelbeds/hotels =>", err);
    return res.status(500).json({ error: "Erro interno ao buscar Disponibilidade + Conteúdo" });
  }
});

export default router;
