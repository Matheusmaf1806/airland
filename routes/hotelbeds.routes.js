////////////////////////////////////////////////////////////////////////
// hotelbeds.routes.js
// Exemplo que busca Disponibilidade + Conteúdo (fotos) numa só rota.
////////////////////////////////////////////////////////////////////////
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

// ---------------------------------------------------------------------
// A) Gera assinatura para X-Signature (mesmo método para Booking e Content API)
function generateSignature(apiKey, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToSign = `${apiKey}${secret}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

// B) URLS base (teste/sandbox). Se estiver em produção, troque "api.test" por "api."
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Cria o router Express
const router = Router();

/**
 * GET /api/hotelbeds/hotels?checkIn=2025-06-15&checkOut=2025-06-20&destination=MCO&rooms=1&adults1=2...
 *
 * 1) Faz POST na Booking API (/hotels) p/ obter disponibilidade e preços
 * 2) Extrai a lista de hotelCodes
 * 3) Faz GET na Content API (/hotel-content-api?codes=...) p/ buscar fotos e descrições
 * 4) Combina tudo e devolve ao front
 */
router.get("/hotels", async (req, res) => {
  try {
    // -------------------------------------------------------------------
    // 1) Ler chaves do .env
    //    SUPOSTO: Se for a mesma credencial p/ Booking e Content
    //    Se forem diferentes, crie duas variáveis e assine separadamente.
    // -------------------------------------------------------------------
    const apiKey    = process.env.API_KEY_HH;    // ex.: "123456"
    const apiSecret = process.env.SECRET_KEY_HH; // ex.: "abcdef..."
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2) Gerar a assinatura
    const signature = generateSignature(apiKey, apiSecret);

    // 3) Ler query params do front
    //    Ex: ?checkIn=2025-06-15&checkOut=2025-06-20&destination=MCO&rooms=1...
    const {
      checkIn     = "2025-06-15",
      checkOut    = "2025-06-20",
      destination = "MCO"
    } = req.query;

    // Se quiser permitir N quartos
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
      // fallback: se não veio nada
      occupancies.push({ rooms:1, adults:2, children:0 });
    }

    // -------------------------------------------------------------------
    // 4) POST /hotels p/ buscar disponibilidade
    // -------------------------------------------------------------------
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

    // bookingJson.hotels.hotels => array de hoteis [ {code, name, rooms[], ...}, ... ]
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      // Se sem hotéis, devolve rápido
      return res.json({
        availability: bookingJson,
        combined: []
      });
    }

    // -------------------------------------------------------------------
    // 5) Pegar a lista de "codes" para chamar a Content API
    // -------------------------------------------------------------------
    // Ex.: [13632, 12903, ...]
    const codes = hotelsArray.map(h => h.code);

    // Atenção: se a lista for muito grande, pode precisar de chunking
    // ou paginação (max 2000 codes). Exemplo simplificado: pegamos todos
    const codesCsv = codes.join(",");

    // -------------------------------------------------------------------
    // 6) GET na Content API p/ buscar fotos e descrições
    // -------------------------------------------------------------------
    //    Precisamos gerars nova signature? Se for a mesma Key/Secret,
    //    sim, mas pode ser a mesma calculada um pouco antes
    const contentHeaders = {
      "Api-Key": apiKey,
      "X-Signature": signature, // mesma signature serve (momento da request)
      "Accept": "application/json"
    };

    // Montar URL, ex.:
    // GET https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels?codes=1234,5678&language=ENG&fields=all
    // Neste ex, pegaremos alguns fields
    // Consulte docs da Content API p/ "language", "from", "to", "fields" etc.
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

    // contentJson.hotels => array [ { code, name, description, images[], ...}, ... ]
    const contentHotels = contentJson?.hotels || [];

    // Transformar em map p/ lookup rápido: { [hotelCode]: {...} }
    let contentMap = {};
    contentHotels.forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // -------------------------------------------------------------------
    // 7) Combinar as duas fontes
    //    => Para cada hotel do booking, anexa "content" do contentMap
    // -------------------------------------------------------------------
    const combined = hotelsArray.map((bkHotel) => {
      const code = bkHotel.code;
      const contentData = contentMap[code] || null; // se não achar, null
      return {
        code,
        // ...dados de disponibilidade
        name: bkHotel.name,
        currency: bkHotel.currency,
        minRate: bkHotel.minRate,
        maxRate: bkHotel.maxRate,
        rooms: bkHotel.rooms, // array de rooms/rates

        // ...dados de conteúdo
        content: contentData ? {
          name: contentData.name,
          description: contentData.description?.content,
          categoryName: contentData.categoryName,
          images: (contentData.images || []).map(img => ({
            path: img.path, 
            type: img.type
          })),
          // e assim por diante
        } : null
      };
    });

    // -------------------------------------------------------------------
    // 8) Retornar o JSON ao front
    //    Pode retornar ambos:
    //      availability (response original do booking)
    //      content (opcional)
    //      combined (array final unificado)
    // -------------------------------------------------------------------
    return res.json({
      availability: bookingJson,  // a resposta original de /hotels
      contentRaw: contentJson,    // a resposta bruta do content API (opcional)
      combined                    // array com merge (geralmente é o que você usa)
    });

  } catch (err) {
    console.error("Erro /api/hotelbeds/hotels =>", err);
    return res.status(500).json({ error: "Erro interno ao buscar Disponibilidade + Conteúdo" });
  }
});

// Exportar
export default router;
