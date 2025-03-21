///////////////////////////////////////////////////////////
// server.js (ESM) - Versão Completa e Ajustada
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
// IMPORTAR ROTAS
// ------------------------------------------------------
import ticketsGenieRouter from "./routes/ticketsgenie.routes.js";
import hbdetailRouter from "./routes/hbdetail.js";
import cartRoutes from "./routes/cart.routes.js";
import getLatestDollar from "./routes/getLatestDollar.js"; // Rota para pegar o último valor do dólar

// Utilizando as rotas
app.use("/api/ticketsgenie", ticketsGenieRouter);
app.use("/api/hbdetail", hbdetailRouter);
app.use("/api", cartRoutes);
app.use("/api/getLatestDollar", getLatestDollar);  // Rota do dólar

// ------------------------------------------------------
// Rota principal (teste)
// ------------------------------------------------------
app.get("/", (req, res) => {
  res.send("Olá, API rodando com ESM, Express e integração das APIs Hotelbeds!");
});

// ------------------------------------------------------
// Função para gerar assinatura de requests (Hotelbeds)
// ------------------------------------------------------
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
// ------------------------------------------------------
app.get("/api/hotelbeds/hotels", async (req, res) => {
  try {
    const { checkIn, checkOut, destination } = req.query;
    const roomsCount = parseInt(req.query.rooms || "1");

    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const adParam = `adults${i}`;
      const chParam = `children${i}`;
      const ad = parseInt(req.query[adParam] || "2");
      const ch = parseInt(req.query[chParam] || "0");
      occupancies.push({ rooms: 1, adults: ad, children: ch });
    }

    const finalCheckIn  = checkIn || "2025-06-15";
    const finalCheckOut = checkOut || "2025-06-16";
    const finalDest     = destination || "MCO";

    const signature = generateSignature();
    const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
    const myHeaders = {
      "Api-key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const bodyData = {
      stay: { checkIn: finalCheckIn, checkOut: finalCheckOut },
      occupancies,
      destination: { code: finalDest }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(bodyData)
    });

    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result.error || "Erro na API Hotelbeds (Booking)" });
    }
    return res.json(result);
  } catch (err) {
    console.error("Erro ao buscar hotéis:", err);
    res.status(500).json({ error: "Erro interno ao buscar hotéis" });
  }
});

// ------------------------------------------------------
// Rota GET para Conteúdo Detalhado (Hotel Content API)
// ------------------------------------------------------
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

    const response = await fetch(url, { method: "GET", headers });
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
// Rota POST para "proxy-hotelbeds" (antiga, opcional)
// ------------------------------------------------------
app.post("/proxy-hotelbeds", async (req, res) => {
  try {
    const signature = generateSignature();
    const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
    const myHeaders = {
      "Api-key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const bodyData = {
      stay: { checkIn: req.body.checkIn || "2025-06-15", checkOut: req.body.checkOut || "2025-06-16" },
      occupancies: [{ rooms: 1, adults: 1, children: 0 }],
      destination: { code: req.body.destination || "MCO" }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(bodyData)
    });

    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result.error || "Erro na API Hotelbeds" });
    }
    return res.json(result);
  } catch (err) {
    console.error("Erro ao buscar dados dos hotéis:", err);
    res.status(500).json({ error: "Erro interno ao buscar hotéis" });
  }
});

// ------------------------------------------------------
// Rota para retornar o último valor do Dólar
// ------------------------------------------------------
app.get("/api/getLatestDollar", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("dollar")
      .select("*")
      .order("last_updated", { ascending: false })
      .limit(1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Nenhum registro encontrado." });
    }

    // Retorna o registro encontrado
    res.status(200).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro inesperado: " + err.message });
  }
});

// ------------------------------------------------------
// Exemplo: rota dinâmica usando Supabase (busca "parks")
// ------------------------------------------------------
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

    // Exemplo de HTML simples para exibir detalhes do parque
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
// Exportar o app para Vercel (sem duplicar app.listen)
// ------------------------------------------------------
export default app;
