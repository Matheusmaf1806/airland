import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// ===============================
// 1) CONFIGURAÇÕES / CONSTANTES
// ===============================
const router = Router();

// Credenciais do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// URLs base (teste). Em produção, troque "api.test" por "api."
const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Gera assinatura (hotelbeds)
function generateSignature(apiKey, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  return crypto
    .createHash("sha256")
    .update(apiKey + secretKey + timestamp)
    .digest("hex");
}

// Tempo de validade do cache de conteúdo (ms). Ex.: 24h
const CACHE_TTL = 24 * 60 * 60 * 1000;

// ===============================
// 2) FUNÇÃO GET /hotels
// ===============================
router.get("/hotels", async (req, res) => {
  try {
    // 2.1) Ler credenciais do .env
    const apiKey = process.env.API_KEY_HH;
    const apiSec = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSec) {
      return res.status(500).json({
        error: "Faltam credenciais (API_KEY_HH, SECRET_KEY_HH) no ambiente."
      });
    }

    // 2.2) Gerar assinatura
    const signature = generateSignature(apiKey, apiSec);

    // 2.3) Ler parâmetros da query (com defaults)
    // Ex.: ?checkIn=2025-06-15&checkOut=2025-06-16&destination=MCO&rooms=1&adults1=2...
    const {
      checkIn = "2025-06-15",
      checkOut = "2025-06-16",
      destination = "MCO"
    } = req.query;

    // Montar array de occupancies
    const roomsCount = parseInt(req.query.rooms || "1", 10);
    const occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const ad = parseInt(req.query[`adults${i}`] || "2", 10);
      const ch = parseInt(req.query[`children${i}`] || "0", 10);
      occupancies.push({ rooms: 1, adults: ad, children: ch });
    }
    if (occupancies.length === 0) {
      occupancies.push({ rooms: 1, adults: 2, children: 0 });
    }

    // 2.4) Chamada à Booking API (POST) para disponibilidade
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
    const limit = 20; // Exemplo: 20 resultados

    const respBooking = await fetch(`${BOOKING_URL}?limit=${limit}`, {
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

    // 2.5) Extrair hotéis retornados
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // 2.6) Obter lista de codes e verificar cache no Supabase
    const codes = hotelsArray.map(h => h.code);
    const codesCsv = codes.join(",");

    // 2.7) Ver quais códigos já estão em cache (e não expirados)
    const now = Date.now();
    const { data: cachedRows, error: cachedError } = await supabase
      .from("hotel_content")
      .select("hotel_code, last_updated, content_data");

    // Montar um map com o que já está em cache e ainda válido
    const cacheMap = {};
    if (!cachedError && cachedRows) {
      cachedRows.forEach(row => {
        const updatedAt = new Date(row.last_updated).getTime();
        if (now - updatedAt < CACHE_TTL) {
          // Está válido
          cacheMap[row.hotel_code] = row.content_data;
        }
      });
    }

    // Filtrar apenas os códigos que NÃO estão no cache válido
    const codesToFetch = codes.filter(code => !cacheMap[code]);
    let contentMap = {};

    if (codesToFetch.length === 0) {
      // 2.7.1) Todos os códigos já estão no cache, então montar contentMap com base no cache
      for (const c of codes) {
        contentMap[c] = (cacheMap[c]?.hotels || [])[0] || null;
      }
    } else {
      // 2.7.2) Precisamos chamar a Content API para os códigos que faltam
      const contentHeaders = {
        "Api-Key": apiKey,
        "X-Signature": signature,
        "Accept": "application/json"
      };
      // Importante: se forem MUITOS códigos, talvez precise dividir em lotes (ex.: 100 por vez).
      const contentUrl = `${CONTENT_URL}?codes=${codesToFetch.join(",")}&language=ENG&fields=all`;

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

      // Montar contentMap para os recém-buscados
      const freshMap = {};
      (contentJson?.hotels || []).forEach(ch => {
        freshMap[ch.code] = ch;
      });

      // 2.7.3) Atualizar / inserir no Supabase
      for (const code of codesToFetch) {
        const cData = {
          hotels: freshMap[code] ? [freshMap[code]] : []
        };
        // Upsert na tabela "hotel_content"
        await supabase
          .from("hotel_content")
          .upsert({
            hotel_code: code,
            content_data: cData,
            last_updated: new Date().toISOString()
          }, { onConflict: "hotel_code" });
      }

      // 2.7.4) Agora unificar freshMap + cacheMap => contentMap final
      // Primeiro pega do cacheMap
      for (const code of codes) {
        if (cacheMap[code]) {
          // Já estava no cache
          const c = cacheMap[code]?.hotels ? cacheMap[code].hotels[0] : null;
          contentMap[code] = c;
        } else {
          // Vem do freshMap
          contentMap[code] = freshMap[code] || null;
        }
      }
    }

    // 2.8) Montar array final "combined"
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
        // Conteúdo
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

    // 2.9) Retorna a resposta final
    return res.json({
      availability: bookingJson,
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
