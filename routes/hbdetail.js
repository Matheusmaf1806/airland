// routes/hbdetail.js
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

const router = Router();

// Função para gerar a assinatura (SHA256)
function generateSignature(apiKey, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToSign = `${apiKey}${secret}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

// URLs base de teste – ajuste para produção conforme necessário
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Rota POST para obter os detalhes do hotel
// Importante: definimos a rota como "/" para que, ao usarmos app.use("/api/hbdetail", router),
// o endpoint final seja "/api/hbdetail"
router.post("/", async (req, res) => {
  try {
    // Recupera as credenciais do ambiente
    const apiKey = process.env.API_KEY_HH;
    const apiSecret = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Credenciais não configuradas (API_KEY_HB, SECRET_KEY_HB)."
      });
    }
    const signature = generateSignature(apiKey, apiSecret);

    // Extrai dados do corpo da requisição
    const { stay, occupancies, hotels } = req.body;
    if (!stay || !occupancies || !hotels || !hotels.hotel) {
      return res.status(400).json({ error: "Payload inválido." });
    }

    // *** Atenção: a API do Hotelbeds exige um filtro único de localização.
    // Se você deseja buscar um hotel específico, use o filtro "hotels".
    // Se quiser buscar por destino, use "destination". Aqui vamos assumir que,
    // se hotel.hotel estiver presente, usaremos esse filtro.
    const requestPayload = { stay, occupancies };
    if (hotels && hotels.hotel) {
      requestPayload.hotels = { hotel: hotels.hotel };
    }
    // Caso contrário, você pode incluir o destino (ou geolocalização) conforme necessário.
    // Exemplo:
    // else if (req.body.destination) {
    //    requestPayload.destination = { code: req.body.destination };
    // }

    // (A) Chamada à Booking API – para disponibilidade, usando POST
    const bookingResp = await fetch(BOOKING_URL, {
      method: "POST",
      headers: {
        "Api-key": apiKey,
        "X-Signature": signature,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestPayload)
    });
    const bookingData = await bookingResp.json();
    if (!bookingResp.ok) {
      return res.status(bookingResp.status).json({
        error: bookingData.error || "Erro na Booking API",
        details: bookingData
      });
    }

    // Filtra os hotéis retornados para manter somente os que foram solicitados
    const requestedCodes = hotels.hotel;
    const bookingHotels = bookingData?.hotels?.hotels || [];
    const filteredBookingHotels = bookingHotels.filter(h =>
      requestedCodes.includes(h.code)
    );
    if (!filteredBookingHotels.length) {
      return res.status(404).json({
        error: "Nenhum hotel encontrado para os códigos fornecidos."
      });
    }

    // (B) Chamada à Content API – para obter dados complementares
    const codesCsv = filteredBookingHotels.map(h => h.code).join(",");
    const contentUrl = `${CONTENT_URL}?codes=${codesCsv}&language=ENG&fields=all`;
    const contentResp = await fetch(contentUrl, {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "X-Signature": signature,
        "Accept": "application/json"
      }
    });
    const contentData = await contentResp.json();
    if (!contentResp.ok) {
      return res.status(contentResp.status).json({
        error: contentData.error || "Erro na Content API",
        details: contentData
      });
    }

    // Cria um mapa de conteúdos por código
    const contentMap = {};
    (contentData?.hotels || []).forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // Combina os dados da Booking API e Content API para cada hotel solicitado
    const combined = filteredBookingHotels.map(bkHotel => {
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
        rooms: bkHotel.rooms,
        content: cData
          ? {
              name: cData.name,
              description: cData.description?.content || "",
              categoryName: cData.categoryName,
              facilities: cData.facilities || [],
              images: (cData.images || []).map(img => ({
                path: img.path,
                type: img.type
              })),
              interestPoints: cData.interestPoints || []
            }
          : null
      };
    });

    return res.json({
      availability: bookingData,
      contentRaw: contentData,
      combined
    });
  } catch (err) {
    console.error("Erro na rota /hbdetail:", err);
    return res.status(500).json({
      error: "Erro interno ao buscar detalhes do hotel.",
      message: err.message
    });
  }
});

export default router;
