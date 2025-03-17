// /api/hotelsController.js
import fetch from "node-fetch";
import crypto from "crypto";
import supabase from "./supabaseClient.js";

// Função para gerar a assinatura para as APIs
function generateSignature(apiKey, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToSign = `${apiKey}${secret}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

// Endpoints da Hotelbeds (teste - troque para produção quando necessário)
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

export async function getHotels(req, res) {
  try {
    // 1) Recupera credenciais do ambiente
    const apiKey = process.env.API_KEY_HH;
    const apiSecret = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2) Gerar assinatura
    const signature = generateSignature(apiKey, apiSecret);

    // 3) Ler parâmetros da query (com valores padrão)
    const { checkIn = "2025-06-15", checkOut = "2025-06-20", destination = "MCO" } = req.query;
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
    // (A) Chamada à Booking API para disponibilidade e preços
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

    const respBooking = await fetch(`${BOOKING_URL}?limit=20`, {
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

    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // --------------------------------------------------------------
    // (B) Chamada à Content API para fotos e descrições
    // --------------------------------------------------------------
    const codesCsv = hotelsArray.map(h => h.code).join(",");
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

    // Cria um map para acesso rápido: contentMap[code] = { ...conteúdo do hotel... }
    const contentMap = {};
    (contentJson?.hotels || []).forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // --------------------------------------------------------------
    // (C) Combinar os dados da Booking e Content API
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

    // --------------------------------------------------------------
    // (D) Salvar ou atualizar os dados no Supabase
    // Aqui, usamos a tabela "hotels_content" (criada no Supabase)
    // Ajuste os nomes dos campos conforme seu schema.
    // --------------------------------------------------------------
    for (const hotel of combined) {
      const { error } = await supabase
        .from("hotels_content")
        .upsert({
          hotel_code: hotel.code,
          name: hotel.name,
          description: hotel.content?.description || null,
          category_code: hotel.categoryCode,
          category_name: hotel.categoryName,
          // Campos opcionais:
          currency: hotel.currency || null,
          content_json: hotel.content // Armazena o JSON completo
          // Adicione outros campos conforme seu schema (ex.: latitude, longitude, etc.)
        }, { returning: "minimal" });

      if (error) {
        console.error(`Erro ao salvar o hotel ${hotel.code}:`, error);
      }
    }

    // --------------------------------------------------------------
    // (E) Retornar os dados combinados ao front
    // --------------------------------------------------------------
    return res.json({
      availability: bookingJson,
      contentRaw: contentJson,
      combined
    });
  } catch (err) {
    console.error("Erro /api/hotels =>", err);
    return res.status(500).json({
      error: "Erro interno ao buscar Disponibilidade + Conteúdo",
      message: err.message
    });
  }
}
