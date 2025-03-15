const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const dotenv = require("dotenv");
const crypto = require("crypto");
const fetch = require("node-fetch");

// 🔹 Carregar variáveis de ambiente
dotenv.config();

// 🔹 Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Criar cliente do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 🔹 Middlewares
app.use(express.json());
app.use(cors()); // Evita problemas de CORS
app.use(express.static(path.join(__dirname, "public"))); // Serve arquivos estáticos
app.use("/js", express.static(path.join(__dirname, "public/js"))); // Serve arquivos JS corretamente

// 🔹 Função para gerar a assinatura X-Signature (Hotelbeds)
function generateSignature() {
  const publicKey = process.env.API_KEY_HH;
  const privateKey = process.env.SECRET_KEY_HH;
  const utcDate = Math.floor(new Date().getTime() / 1000);
  const assemble = `${publicKey}${privateKey}${utcDate}`;
  return crypto.createHash("sha256").update(assemble).digest("hex");
}

// 🔹 Proxy para Hotelbeds (Busca de Hotéis)
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

// 🔹 Proxy para TicketsGenie (Lista de parques)
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

// 🔹 Proxy para TicketsGenie (Detalhes do Parque)
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

// 🔹 Proxy para TicketsGenie (Produtos do Parque)
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

// 🔹 Rota dinâmica para detalhes do parque
app.get("/park-details/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("parks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Parque não encontrado" });
    }

    const parkDetails = `
      <html>
        <head>
          <title>${data.name} - Walt Disney World Resort</title>
        </head>
        <body>
          <h1>${data.name}</h1>
          <p>${data.description}</p>
          <img src="${data.images.cover}" alt="${data.name}" />
        </body>
      </html>
    `;
    res.send(parkDetails);
  } catch (error) {
    console.error("Erro ao buscar parque:", error);
    res.status(500).json({ error: "Erro ao buscar parque" });
  }
});

// 🔹 Rota principal de teste
app.get("/", (req, res) => {
  res.send("API Airland está rodando 🚀");
});

// 🔹 Inicia o servidor na porta 3000 ou na porta configurada pela Vercel
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// 🔹 Exporta o app para a Vercel
module.exports = app;
