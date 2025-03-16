import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Função para gerar a assinatura X-Signature da API Hotelbeds
function generateSignature() {
  const publicKey = process.env.API_KEY_HH;
  const privateKey = process.env.SECRET_KEY_HH;
  const utcDate = Math.floor(new Date().getTime() / 1000);
  const assemble = `${publicKey}${privateKey}${utcDate}`;
  return crypto.createHash("sha256").update(assemble).digest("hex");
}

// Proxy para buscar hotéis via Hotelbeds (combinação de Booking API e Content API)
router.get("/hotels", async (req, res) => {
  try {
    // Extrair parâmetros da query
    const { checkIn, checkOut, destination } = req.query;
    const roomsCount = parseInt(req.query.rooms || "1");

    // Montar o array de occupancies conforme o número de quartos
    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const adParam = `adults${i}`;
      const chParam = `children${i}`;
      const ad = parseInt(req.query[adParam] || "2"); // default: 2 adultos
      const ch = parseInt(req.query[chParam] || "0"); // default: 0 crianças

      occupancies.push({
        rooms: 1,
        adults: ad,
        children: ch
      });
    }

    // Definir valores padrão se faltarem parâmetros
    const finalCheckIn  = checkIn  || "2025-06-15";
    const finalCheckOut = checkOut || "2025-06-16";
    const finalDest     = destination || "MCO";

    // Gerar assinatura e montar headers para a Booking API
    const signature = generateSignature();
    const bookingUrl = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
    const bookingHeaders = {
      "Api-key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    // Montar corpo da requisição para a Booking API
    const bodyData = {
      stay: {
        checkIn: finalCheckIn,
        checkOut: finalCheckOut
      },
      occupancies,
      destination: {
        code: finalDest
      }
    };

    // Fazer POST na Booking API
    const bookingResponse = await fetch(bookingUrl, {
      method: "POST",
      headers: bookingHeaders,
      body: JSON.stringify(bodyData)
    });

    const bookingJson = await bookingResponse.json();
    if (!bookingResponse.ok) {
      return res.status(bookingResponse.status).json({
        error: bookingJson.error || "Erro na API Hotelbeds (Booking)",
        details: bookingJson
      });
    }

    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // Pega lista de hotelCodes para chamar a Content API
    const codes = hotelsArray.map(h => h.code);
    const codesCsv = codes.join(",");

    // Gerar assinatura para a Content API
    const contentUrl = `https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels?codes=${codesCsv}&language=ENG&fields=all`;
    const contentHeaders = {
      "Api-Key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Accept": "application/json"
    };

    // Fazer GET na Content API
    const contentResponse = await fetch(contentUrl, {
      method: "GET",
      headers: contentHeaders
    });
    
    const contentJson = await contentResponse.json();
    if (!contentResponse.ok) {
      return res.status(contentResponse.status).json({
        error: contentJson.error || "Erro na API Hotelbeds (Content)",
        details: contentJson
      });
    }

    const contentHotels = contentJson?.hotels || [];

    // Mapear os resultados da Content API por hotelCode para facilitar o lookup
    const contentMap = {};
    contentHotels.forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // Combinar os dados de disponibilidade com os dados de conteúdo
    const combined = hotelsArray.map((bkHotel) => {
      const code = bkHotel.code;
      const contentData = contentMap[code] || null; // se não achar, usa null

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

    // Retornar os dados combinados, junto com as respostas originais
    return res.json({
      availability: bookingJson,
      contentRaw: contentJson,
      combined
    });

  } catch (err) {
    console.error("Erro ao buscar hotéis:", err);
    res.status(500).json({
      error: "Erro interno ao buscar hotéis",
      message: err.message
    });
  }
});

export default router;
