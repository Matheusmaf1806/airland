////////////////////////////////////////////////////////////////////////
// hotelbeds.routes.js
// Combina Disponibilidade/Preços (Booking API) + Conteúdo (Content API)
// em uma só rota GET /api/hotelbeds/hotels
////////////////////////////////////////////////////////////////////////

import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

//////////////////////////////////////////////////////////////////////
// 1) Função para gerar X-Signature (pode ser usada p/ Booking e Content)
//////////////////////////////////////////////////////////////////////
function generateSignature(apiKey, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000); // SEGUNDOS
  const dataToSign = `${apiKey}${secretKey}${timestamp}`;

  return crypto
    .createHash("sha256")
    .update(dataToSign)
    .digest("hex");
}

//////////////////////////////////////////////////////////////////////
// 2) URLs base das APIs
//    (Se estiver em produção, troque "api.test" por "api.")
//////////////////////////////////////////////////////////////////////
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Router do Express
const router = Router();

/**
 * GET /api/hotelbeds/hotels
 * Exemplos de uso:
 *   /api/hotelbeds/hotels?checkIn=2025-06-15&checkOut=2025-06-20&destination=MCO
 *   &rooms=2&adults1=2&children1=1&adults2=2&children2=0
 *
 * 1) Faz POST no endpoint Booking (/hotel-api/1.0/hotels) p/ obter disponibilidade e preços
 * 2) Extrai os códigos de hotel
 * 3) Faz GET no endpoint Content (/hotel-content-api/1.0/hotels) p/ obter fotos, descrições, etc.
 * 4) Combina tudo em um array final
 */
router.get("/hotels", async (req, res) => {
  try {
    //////////////////////////////////////////////////////////////
    // A) Ler variáveis de ambiente (API_KEY_HH, SECRET_KEY_HH)
    //////////////////////////////////////////////////////////////
    const apiKey = process.env.API_KEY_HH;
    const secretKey = process.env.SECRET_KEY_HH;
    if (!apiKey || !secretKey) {
      return res
        .status(500)
        .json({ error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no .env" });
    }

    // Gera a signature. Se for usar a mesma credencial para as duas APIs, 1x basta.
    const signature = generateSignature(apiKey, secretKey);

    //////////////////////////////////////////////////////////////
    // B) Ler Query Params, com fallback se não vier
    //////////////////////////////////////////////////////////////
    // Exemplo de query:
    // ?checkIn=2025-06-15&checkOut=2025-06-20&destination=MCO
    // &rooms=2&adults1=2&children1=1&adults2=2&children2=0
    const {
      checkIn     = "2025-06-15",
      checkOut    = "2025-06-20",
      destination = "MCO"          // pode ser uma city code ou IATA
    } = req.query;

    // Lê a quantidade de “blocos” de quartos para extrair adX/childX
    const roomsCount = parseInt(req.query.rooms || "1", 10);

    // Montar array 'occupancies'
    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      // ex.: adults1=2, children1=1
      const adParam = `adults${i}`;
      const chParam = `children${i}`;

      // fallback
      const ad = parseInt(req.query[adParam] || "2", 10);
      const ch = parseInt(req.query[chParam] || "0", 10);

      occupancies.push({
        rooms: 1,
        adults: ad,
        children: ch
      });
    }
    // Se nada vier, fallback 1 quarto, 2 adultos
    if (occupancies.length === 0) {
      occupancies.push({ rooms: 1, adults: 2, children: 0 });
    }

    //////////////////////////////////////////////////////////////
    // C) Chamar a Booking API /hotels (POST) p/ Disponibilidade
    //////////////////////////////////////////////////////////////
    const bookingHeaders = {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    // Montar body p/ POST
    const bodyData = {
      stay: {
        checkIn,
        checkOut
      },
      occupancies,
      destination: {
        code: destination
      }
      // se precisar de boards, geolocation, filters, etc. adicione aqui
    };

    // Faz a requisição
    const respBooking = await fetch(BOOKING_URL, {
      method: "POST",
      headers: bookingHeaders,
      body: JSON.stringify(bodyData)
    });
    const bookingJson = await respBooking.json();

    // Se a API Hotelbeds (booking) retornar erro, pare e devolva
    if (!respBooking.ok) {
      return res.status(respBooking.status).json({
        error: bookingJson.error || "Erro na API Hotelbeds (Booking)",
        details: bookingJson
      });
    }

    // bookingJson.hotels.hotels => array de hoteis
    const hotelsBooking = bookingJson?.hotels?.hotels || [];
    if (!hotelsBooking.length) {
      // Se 0 hoteis retornados, devolve
      return res.json({
        availability: bookingJson,
        combined: []
      });
    }

    //////////////////////////////////////////////////////////////
    // D) Extrair os “hotelCodes” para buscar o Conteúdo
    //////////////////////////////////////////////////////////////
    // Atenção p/ chunk (no doc: max 2000 codes por request)
    // Para simplificar, assumindo que a gente não exceda 2000
    // Se exceder, seria preciso chunkar o array e fazer + de 1 GET
    const allCodes = hotelsBooking.map(h => h.code);
    const codesCsv = allCodes.join(",");

    //////////////////////////////////////////////////////////////
    // E) Chamar a Content API /hotel-content-api/1.0/hotels (GET)
    //////////////////////////////////////////////////////////////
    // Poderia usar outro par de credenciais se fosse diferente.
    const contentHeaders = {
      "Api-Key": apiKey,
      "X-Signature": signature,
      "Accept": "application/json"
    };

    // Parâmetros. Ex.: language=ENG, fields=all
    // Ajuste se quiser, inclusive para ler language do front
    const language = "ENG";
    const fields   = "all";

    // Montar URL
    // Exemplo: https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels?codes=1234,5678&language=ENG&fields=all
    const contentUrl = `${CONTENT_URL}?codes=${codesCsv}&language=${language}&fields=${fields}`;

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

    // contentJson.hotels => array de hoteis com dados extras (fotos, descrições)
    const hotelsContent = contentJson?.hotels || [];

    // Montar MAP p/ lookup: { code: { ...dados... } }
    let mapContent = {};
    hotelsContent.forEach((hc) => {
      mapContent[hc.code] = hc;
    });

    //////////////////////////////////////////////////////////////
    // F) Combinar Booking e Content
    //////////////////////////////////////////////////////////////
    // Ex. final: 
    // {
    //   code: 1234,
    //   name: "Hotel do booking",
    //   minRate, maxRate, currency, rooms: [ ... ],
    //   content: {
    //     name, description, categoryName, images: [ ... ]
    //   }
    // }
    const combined = hotelsBooking.map((bk) => {
      const cData = mapContent[bk.code] || null;

      return {
        code: bk.code,
        name: bk.name,
        currency: bk.currency,
        minRate: bk.minRate,
        maxRate: bk.maxRate,
        rooms: bk.rooms, // array de rooms e suas rates

        content: cData ? {
          name: cData.name,
          categoryName: cData.categoryName,
          description: cData.description?.content,
          images: (cData.images || []).map(img => ({
            path: img.path,
            type: img.type
          })),
          // ... adicione outras props se precisar
        } : null
      };
    });

    //////////////////////////////////////////////////////////////
    // G) Devolver ao front
    //////////////////////////////////////////////////////////////
    // availability => json completo do booking
    // contentRaw   => opcional, se quiser ver o bruto
    // combined     => array final unificado
    return res.json({
      availability: bookingJson,
      contentRaw: contentJson,
      combined
    });

  } catch (err) {
    console.error("Erro geral /api/hotelbeds/hotels:", err);
    return res
      .status(500)
      .json({ error: "Erro interno ao buscar Disponibilidade + Conteúdo" });
  }
});

export default router;
