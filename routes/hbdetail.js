////////////////////////////////////////////////////////////////////////
// routes/hotelbeds.routes.js
////////////////////////////////////////////////////////////////////////
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

const router = Router();

// Função para gerar a assinatura para Booking e Content API
function generateSignature(apiKey, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToSign = `${apiKey}${secret}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

// URLs base de teste (substituir "api.test" por "api." em produção)
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

/***********************************************
 * Rota GET /hotels
 * Disponibilidade + conteúdo (já existente)
 ***********************************************/
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
      checkIn     = "2025-06-15",
      checkOut    = "2025-06-20",
      destination = "MCO"
    } = req.query;

    // Exemplo: se quiser page, limit, etc. => const { page = 1, limit = 20 } = req.query;

    // 4) Montar occupancies com base em rooms e adultsN / childrenN
    const roomsCount = parseInt(req.query.rooms || "1", 10);
    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const adults = parseInt(req.query[`adults${i}`] || "2", 10);
      const children = parseInt(req.query[`children${i}`] || "0", 10);
      occupancies.push({ rooms: 1, adults, children });
    }
    // Se não veio nada, default 1 quarto, 2 adultos
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

    const bodyData = {
      stay: { checkIn, checkOut },
      occupancies,
      destinathotels: { hotel: [13621] }
    };

    // Faz POST na Booking API
    const respBooking = await fetch(BOOKING_URL, {
      method: "POST",
      headers: bookingHeaders,
      body: JSON.stringify(bodyData)
    });
    const bookingJson = await respBooking.json();

    // Se deu erro, retorna
    if (!respBooking.ok) {
      return res.status(respBooking.status).json({
        error: bookingJson.error || "Erro na API Hotelbeds (Booking)",
        details: bookingJson
      });
    }

    // Array de hotéis retornados
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      // Se vazio, não chama content
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // --------------------------------------------------------------
    // (B) Chamada à Content API => fotos e descrições
    // --------------------------------------------------------------
    // Junta todos os "code" em uma CSV "1234,5678"
    const codes = hotelsArray.map(h => h.code);
    const codesCsv = codes.join(",");

    const contentHeaders = {
      "Api-Key": apiKey,
      "X-Signature": signature,
      "Accept": "application/json"
    };

    // Exemplo: GET /hotel-content-api/1.0/hotels?codes=123,456&language=ENG&fields=all
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

    // Cria um map => contentMap[code] = { ...info... }
    const contentMap = {};
    (contentJson?.hotels || []).forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // --------------------------------------------------------------
    // (C) Combinar booking + content => "combined"
    // --------------------------------------------------------------
    const combined = hotelsArray.map(bkHotel => {
      const code = bkHotel.code;
      const cData = contentMap[code] || null;

      // Exemplo de mesclagem
      return {
        code,
        name: bkHotel.name,
        categoryCode: bkHotel.categoryCode,
        categoryName: bkHotel.categoryName,
        minRate: bkHotel.minRate,
        maxRate: bkHotel.maxRate,
        currency: bkHotel.currency,
        rooms: bkHotel.rooms,
        // Anexa o que quiser de cData
        content: cData ? {
          name: cData.name,
          description: cData.description?.content || "",
          categoryName: cData.categoryName,
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
    // (D) Retorna ao front => "combined"
    // --------------------------------------------------------------
    return res.json({
      availability: bookingJson,  // dados brutos de booking
      contentRaw: contentJson,    // dados brutos de content
      combined                    // array mesclado p/ front
    });

  } catch (err) {
    console.error("Erro /api/hotelbeds/hotels =>", err);
    return res.status(500).json({
      error: "Erro interno ao buscar Disponibilidade + Conteúdo",
      message: err.message
    });
  }
});

/***********************************************
 * Nova rota POST /prices
 * Busca os preços utilizando payload semelhante ao exemplo do Postman.
 ***********************************************/
router.post("/prices", async (req, res) => {
  try {
    // Recupera as credenciais do ambiente
    const apiKey = process.env.API_KEY_HH;
    const apiSecret = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // Gera a assinatura
    const signature = generateSignature(apiKey, apiSecret);

    // Extrai o payload enviado (espera { stay, occupancies, hotels })
    const { stay, occupancies, hotels } = req.body;
    if (!stay || !occupancies || !hotels) {
      return res.status(400).json({ error: "Payload inválido. Espera { stay, occupancies, hotels }" });
    }

    // Configura os headers para a requisição
    const headers = {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    // Faz o POST para a Booking API com o payload
    const response = await fetch(BOOKING_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ stay, occupancies, hotels })
    });

    const json = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: json.error || "Erro na API Hotelbeds (Prices)",
        details: json
      });
    }

    return res.json(json);
  } catch (err) {
    console.error("Erro em /api/hotelbeds/prices =>", err);
    return res.status(500).json({
      error: "Erro interno ao buscar preços",
      message: err.message
    });
  }
});

export default router;
