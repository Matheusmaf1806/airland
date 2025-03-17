///////////////////////////////////////////////////////////
// server.js (ESM) - Versão Final com Supabase Upsert
///////////////////////////////////////////////////////////

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// 1) Carregar variáveis do .env
dotenv.config();

// 2) Resolver __dirname em modo ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3) Criar cliente do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 4) Inicializar Express
const app = express();
app.use(express.json());
app.use(cors());

// 5) Servir arquivos estáticos a partir de /public
app.use(express.static(path.join(__dirname, "public")));

// ------------------------------------------------------
// Exemplo de rota de Tickets Genie (seu outro serviço)
import ticketsGenieRouter from "./routes/ticketsgenie.routes.js";
app.use("/api/ticketsgenie", ticketsGenieRouter);

// ------------------------------------------------------
// Rota principal (teste)
app.get("/", (req, res) => {
  res.send("Olá, API rodando com ESM, Express e integração das APIs Hotelbeds!");
});

// ------------------------------------------------------
// Função para gerar assinatura de requests (Hotelbeds)
function generateSignature() {
  const publicKey  = process.env.API_KEY_HH;    // ex.: "123456..."
  const privateKey = process.env.SECRET_KEY_HH;  // ex.: "abcXYZ..."
  const utcDate    = Math.floor(Date.now() / 1000);
  const assemble   = `${publicKey}${privateKey}${utcDate}`;
  return crypto.createHash("sha256").update(assemble).digest("hex");
}

// ------------------------------------------------------
// Rota GET para Preço / Disponibilidade (Hotel Booking API)
// Exemplo de chamada: 
// GET /api/hotelbeds/hotels?checkIn=2025-06-15&checkOut=2025-06-16&destination=MCO&rooms=2&adults1=2&children1=1&adults2=2&children2=0
app.get("/api/hotelbeds/hotels", async (req, res) => {
  try {
    // 1) Extrair parâmetros da query
    const { checkIn, checkOut, destination } = req.query;
    const roomsCount = parseInt(req.query.rooms || "1");

    // 2) Montar o array de occupancies conforme o número de quartos
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

    // 3) Definir valores padrão se faltarem parâmetros
    const finalCheckIn  = checkIn  || "2025-06-15";
    const finalCheckOut = checkOut || "2025-06-16";
    const finalDest     = destination || "MCO";

    // 4) Gerar assinatura e montar headers para a Booking API
    const signature = generateSignature();
    const bookingUrl = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels"; // Endpoint da Booking API
    const bookingHeaders = {
      "Api-key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    // 5) Montar corpo da requisição conforme availabilityRQ
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

    // 6) Fazer POST na Booking API
    const respBooking = await fetch(`${bookingUrl}?limit=20`, {
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

    // 7) Extrair array de hotéis da resposta da Booking API
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({
        availability: bookingJson,
        contentRaw: null,
        combined: []
      });
    }

    // 8) Chamada à Content API – montar CSV de códigos
    const codesCsv = hotelsArray.map(h => h.code).join(",");
    const contentHeaders = {
      "Api-Key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Accept": "application/json"
    };
    const contentUrl = `https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels?codes=${codesCsv}&language=ENG&fields=all`;
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

    // 9) Mapear os dados da Content API por código do hotel
    const contentMap = {};
    (contentJson?.hotels || []).forEach(ch => {
      contentMap[ch.code] = ch;
    });

    // 10) Combinar os dados de Booking e Content API
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
        content: cData ? {
          name: cData.name,
          description: cData.description?.content || "",
          categoryName: cData.categoryName,
          facilities: cData.facilities || [],
          images: (cData.images || []).map(img => ({
            path: img.path,
            type: img.type
          })),
          interestPoints: cData.interestPoints || [],
          // Outras propriedades que desejar salvar...
        } : null
      };
    });

    // 11) Salvar ou atualizar os dados combinados no Supabase
    for (const hotel of combined) {
      const { error } = await supabase
        .from("hotels_content")
        .upsert({
          hotel_code: hotel.code,
          name: hotel.name,
          description: hotel.content?.description || null,
          // Você pode ajustar os campos abaixo conforme os dados disponíveis
          country_code: hotel.content?.country?.isoCode || null,
          state_code: hotel.content?.state?.code || null,
          city_name: hotel.content?.city?.content || null,
          category_code: hotel.categoryCode,
          category_name: hotel.categoryName,
          latitude: hotel.content?.coordinates?.latitude || null,
          longitude: hotel.content?.coordinates?.longitude || null,
          address_street: hotel.content?.address?.street || null,
          postal_code: hotel.content?.postalCode || null,
          zone_code: hotel.content?.zone?.zoneCode || null,
          zone_name: hotel.content?.zone?.name || null,
          chain_code: hotel.content?.chain?.code || null,
          chain_desc: hotel.content?.chain?.description?.content || null,
          content_json: hotel.content
        }, { returning: 'minimal' });

      if (error) {
        console.error(`Erro ao salvar o hotel ${hotel.code}:`, error);
      }
    }

    // 12) Retornar os dados combinados para o front-end
    return res.json({
      availability: bookingJson,
      contentRaw: contentJson,
      combined
    });

  } catch (err) {
    console.error("Erro ao buscar hotéis (GET /api/hotelbeds/hotels):", err);
    res.status(500).json({ error: "Erro interno ao buscar hotéis" });
  }
});

// ------------------------------------------------------
// Rota GET para Conteúdo Detalhado (Hotel Content API)
// Exemplo de chamada: GET /api/hotelbeds/hotel-content?hotelCode=123223
app.get("/api/hotelbeds/hotel-content", async (req, res) => {
  try {
    const { hotelCode } = req.query;
    if (!hotelCode) {
      return res.status(400).json({ error: "O parâmetro 'hotelCode' é obrigatório." });
    }

    const signature = generateSignature();
    const url = `https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels/${hotelCode}`;
    const headers = {
      "Api-key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const response = await fetch(url, {
      method: "GET",
      headers
    });
    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result.error || "Erro na API Hotelbeds (Content)" });
    }
    return res.json(result);

  } catch (err) {
    console.error("Erro ao buscar conteúdo detalhado do hotel:", err);
    res.status(500).json({ error: "Erro interno ao buscar conteúdo detalhado do hotel" });
  }
});

// ------------------------------------------------------
// Rota POST para "proxy-hotelbeds" (opcional)
app.post("/proxy-hotelbeds", async (req, res) => {
  try {
    const signature = generateSignature();
    const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";

    const headers = {
      "Api-key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const bodyData = {
      stay: {
        checkIn:  req.body.checkIn  || "2025-06-15",
        checkOut: req.body.checkOut || "2025-06-16"
      },
      occupancies: [
        { rooms: 1, adults: 1, children: 0 }
      ],
      destination: { code: req.body.destination || "MCO" }
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyData)
    });
    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result.error || "Erro na API Hotelbeds" });
    }
    return res.json(result);

  } catch (err) {
    console.error("Erro ao buscar dados dos hotéis (POST /proxy-hotelbeds):", err);
    res.status(500).json({ error: "Erro interno ao buscar hotéis" });
  }
});

// ------------------------------------------------------
// Exemplo de rota dinâmica usando Supabase (busca "parks")
app.get("/park-details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("parks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Parque não encontrado" });
    }

    const parkDetails = `
      <html>
        <head><title>${data.name}</title></head>
        <body>
          <h1>${data.name}</h1>
          <p>${data.description}</p>
          <img src="${data.images.cover}" alt="${data.name}" />
        </body>
      </html>
    `;
    res.send(parkDetails);

  } catch (err) {
    console.error("Erro ao buscar parque:", err);
    res.status(500).json({ error: "Erro interno ao buscar parque" });
  }
});

// ------------------------------------------------------
// Exportar app para a Vercel (sem duplicar app.listen)
export default app;
