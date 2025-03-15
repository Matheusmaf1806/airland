const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const crypto = require("crypto");

// Carregar variáveis de ambiente
dotenv.config();

// Criando cliente do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const app = express();

// Middlewares
app.use(express.json());
app.use(cors()); // Evita problemas de CORS

// Configuração para servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, "public"))); // A pasta public

// Função para gerar a assinatura X-Signature
function generateSignature() {
  const publicKey = process.env.API_KEY_HH;
  const privateKey = process.env.SECRET_KEY_HH;
  const utcDate = Math.floor(new Date().getTime() / 1000);
  const assemble = `${publicKey}${privateKey}${utcDate}`;
  return crypto.createHash("sha256").update(assemble).digest("hex");
}

// Proxy para Hotelbeds
app.post("/proxy-hotelbeds", async (req, res) => {
  const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
  const signature = generateSignature();

  const myHeaders = {
    "Api-key": process.env.API_KEY_HH,
    "X-Signature": signature,
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  const bodyData = {
    stay: {
      checkIn: req.body.checkIn || "2025-06-15",
      checkOut: req.body.checkOut || "2025-06-16"
    },
    occupancies: [{ rooms: 1, adults: 1, children: 0 }],
    destination: { code: req.body.destination || "MCO" }
  };

  try {
    const response = await fetch(url, { method: "POST", headers: myHeaders, body: JSON.stringify(bodyData) });
    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: result.error || "Erro desconhecido na API Hotelbeds" });
    }

    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar hotéis:", error);
    res.status(500).json({ error: "Erro ao buscar dados dos hotéis" });
  }
});

// Proxy para TicketsGenie (evita erro de CORS)
app.get("/api/ticketsgenie/parks", async (req, res) => {
  try {
    const response = await fetch("https://devapi.ticketsgenie.app/v1/parks", {
      method: "GET",
      headers: {
        "x-api-key": process.env.TICKETSGENIE_API_KEY,
        "x-api-secret": process.env.TICKETSGENIE_API_SECRET,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erro ao buscar dados da API TicketsGenie" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar parques:", error);
    res.status(500).json({ error: "Erro ao buscar parques" });
  }
});

// Proxy para TicketsGenie (Parque específico)
app.get("/api/ticketsgenie/parks/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const response = await fetch(`https://devapi.ticketsgenie.app/v1/parks/${id}`, {
      method: "GET",
      headers: {
        "x-api-key": process.env.TICKETSGENIE_API_KEY,
        "x-api-secret": process.env.TICKETSGENIE_API_SECRET,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erro ao buscar detalhes do parque" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar detalhes do parque:", error);
    res.status(500).json({ error: "Erro ao buscar detalhes do parque" });
  }
});

// Proxy para TicketsGenie (Produtos do Parque)
app.get("/api/ticketsgenie/parks/:id/products", async (req, res) => {
  const { id } = req.params;

  try {
    const response = await fetch(`https://devapi.ticketsgenie.app/v1/parks/${id}/products`, {
      method: "GET",
      headers: {
        "x-api-key": process.env.TICKETSGENIE_API_KEY,
        "x-api-secret": process.env.TICKETSGENIE_API_SECRET,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erro ao buscar produtos do parque" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar produtos do parque:", error);
    res.status(500).json({ error: "Erro ao buscar produtos do parque" });
  }
});

// Rota principal de teste
app.get("/", (req, res) => {
  res.send("API Airland está rodando 🚀");
});

// Inicia o servidor na porta 3000 ou na porta configurada pela Vercel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// Exporta o app para a Vercel
module.exports = app;
