///////////////////////////////////////////////////////////
// server.js (ESM) - Versão Final com PayPal Integrado
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

// 3) Criar cliente do Supabase (exemplo)
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
// IMPORTAR ROTAS EXISTENTES
// ------------------------------------------------------
import ticketsGenieRouter from "./routes/ticketsgenie.routes.js";
import hbdetailRouter from "./routes/hbdetail.js";
import cartRoutes from "./routes/cart.routes.js";
import getLatestDollar from "./routes/getLatestDollar.js";
import userRoutes from "./routes/user.routes.js";
import { getAffiliateColors } from "./routes/affiliateColors.js";
import payRouter from "./routes/pay.routes.js"; // Rota para pagamento com PayPal

app.use("/api/ticketsgenie", ticketsGenieRouter);
app.use("/api/hbdetail", hbdetailRouter);
app.use("/api", cartRoutes);
app.get("/api/getLatestDollar", getLatestDollar);
app.use("/api/users", userRoutes);
app.get("/api/affiliateColors", getAffiliateColors);

// ------------------------------------------------------
// Usar a rota do PayPal
app.use("/api/pay", payRouter); // Integrando a rota de pagamento PayPal

// ------------------------------------------------------
// Rota principal (teste)
app.get("/", (req, res) => {
  res.send("Olá, API rodando com ESM, Express e integração das APIs Hotelbeds e PayPal!");
});

// ------------------------------------------------------
// Função para gerar assinatura de requests (Hotelbeds)
function generateSignature() {
  const publicKey  = process.env.API_KEY_HH;    // ex.: "123456..."
  const privateKey = process.env.SECRET_KEY_HH;   // ex.: "abcXYZ..."
  const utcDate    = Math.floor(Date.now() / 1000);
  const assemble   = `${publicKey}${privateKey}${utcDate}`;
  return crypto.createHash("sha256").update(assemble).digest("hex");
}

// ------------------------------------------------------
// Rota GET para Preço / Disponibilidade (Hotelbeds)
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

    const finalCheckIn  = checkIn  || "2025-06-15";
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
// Rota GET para Conteúdo Detalhado (Hotelbeds - Content API)
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
      stay: {
        checkIn:  req.body.checkIn  || "2025-06-15",
        checkOut: req.body.checkOut || "2025-06-16"
      },
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
// Usando a rota do PayPal (sem SDK, via API)
import payRouter from './routes/pay.routes.js';
app.use("/api/pay", payRouter); // Integrando a rota de pagamento com o PayPal

// ------------------------------------------------------
// Iniciar o servidor localmente (para ambiente não serverless)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;
