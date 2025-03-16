import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

// ---------------------------------------------------------------------
// A) Gera assinatura para X-Signature (mesmo método p/ Booking e Content API)
function generateSignature(apiKey, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000); // em segundos
  const dataToSign = `${apiKey}${secretKey}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

// B) URLs base (teste/sandbox). Em produção, use "api.hotelbeds.com"
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Cria o router Express
const router = Router();

/**
 * GET /api/hotelbeds/hotels?checkIn=2025-06-15&checkOut=2025-06-20&destination=MCO&rooms=1&adults1=2...
 *
 * Fluxo:
 * 1) POST na Booking API (/hotels) p/ obter disponibilidade e preços
 * 2) Extrai a lista de hotelCodes
 * 3) GET na Content API (/hotel-content-api?codes=...) p/ buscar fotos e descrições
 * 4) Combina tudo e devolve ao front
 */
router.get("/hotels", async (req, res) => {
  try {
    // -------------------------------------------------------------------
    // 1) Ler chaves do .env
    // -------------------------------------------------------------------
    const apiKey    = process.env.API_KEY_HH;    
    const secretKey = process.env.SECRET_KEY_HH; 
    if (!apiKey || !secretKey) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2) Gerar a assinatura
    const signature = generateSignature(apiKey, secretKey);

    // 3) Ler query params do front
    //    Ex: ?checkIn=2025-06-15&checkOut=2025-06-20&destination=MCO&rooms=2&adults1=2&children1=1
    const {
      checkIn     = "2025-06-15",
      checkOut    = "2025-06-20",
      destination = "MCO",
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
    // fallback se não tiver nada
    if (occupancies.length === 0) {
      occupancies.push({ rooms:1, adults:2, children:0 });
    }

    // -------------------------------------------------------------------
    // 4) POST /hotels (Booking API) p/ buscar disponibilidade
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
      // se quiser filtrar p/ 1 ou 2 hoteis específicos:
      // hotels: { hotel: [1234, 5678] }
      // ou se quiser geolocation, etc. – ver doc
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
      // Se não vier nenhum hotel, devolve rápido
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

    // Se a lista for muito grande, pode ser preciso chunking (máx. 2000 codes).
    // Exemplo simples: todos de uma vez
    const codesCsv = codes.join(",");

    // -------------------------------------------------------------------
    // 6) GET na Content API p/ buscar fotos e descrições
    // -------------------------------------------------------------------
    //    Reutilizamos a mesma signature (ou geramos de novo – não faz mal).
    const contentHeaders = {
      "Api-Key": apiKey,
      "X-Signature": signature,
      "Accept": "application/json"
    };

    // Montar URL, ex.:
    // GET https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels?codes=1234,5678&language=ENG&fields=all
    // Ajuste "language", "fields" conforme necessidade
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
        categoryCode: bkHotel.categoryCode,
        rooms: bkHotel.rooms, // array de rooms/rates

        // ...dados de conteúdo
        content: contentData ? {
          name: contentData.name,
          categoryName: contentData.categoryName,
          description: contentData.description?.content,
          images: contentData.images || [], // array de {path, type, order, visualizationOrder...}
          // se quiser address, phone, etc.
          address: contentData.address?.content,
          // e assim por diante
        } : null
      };
    });

    // -------------------------------------------------------------------
    // 8) Retornar o JSON ao front
    // -------------------------------------------------------------------
    return res.json({
      availability: bookingJson,  // a resposta original de /hotels
      contentRaw: contentJson,    // a resposta bruta do content API (opcional)
      combined                    // array com merge final
    });

  } catch (err) {
    console.error("Erro /api/hotelbeds/hotels =>", err);
    return res.status(500).json({
      error: "Erro interno ao buscar Disponibilidade + Conteúdo",
      details: String(err)
    });
  }
});

// Exportar o router
export default router;
