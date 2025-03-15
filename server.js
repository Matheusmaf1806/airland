import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import dotenv from "dotenv";
import crypto from "crypto";
import { router as hotelbedsRoutes } from "./api/hotelbeds.js";

// 🔹 Carregar variáveis de ambiente
dotenv.config();

// 🔹 Configuração do caminho correto para servir arquivos estáticos na Vercel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Criar cliente do Supabase com variáveis de ambiente da Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 🔹 Middlewares
app.use(express.json());
app.use(cors()); // Habilita CORS para evitar problemas com requisições externas
app.use(express.static(path.join(__dirname, "public"))); // Servir arquivos estáticos da pasta "public"

// 🔹 Função para gerar a assinatura X-Signature (Hotelbeds)
function generateSignature() {
  const publicKey = process.env.API_KEY_HH;
  const privateKey = process.env.SECRET_KEY_HH;
  const utcDate = Math.floor(new Date().getTime() / 1000); // Timestamp UTC (em segundos)
  const assemble = `${publicKey}${privateKey}${utcDate}`; // Combina os dados necessários para gerar a assinatura

  return crypto.createHash("sha256").update(assemble).digest("hex");
}

// 🔹 Rota Proxy para Hotelbeds
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

  const requestOptions = { method: "POST", headers: myHeaders, body: JSON.stringify(bodyData) };

  try {
    const response = await fetch(url, requestOptions);
    const result = await response.json();

    if (response.ok) {
      res.json(result);
    } else {
      throw new Error(result.error || "Erro desconhecido na API Hotelbeds");
    }
  } catch (error) {
    console.error("Erro ao buscar dados dos hotéis:", error);
    res.status(500).json({ error: "Erro ao buscar dados dos hotéis" });
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

// 🔹 Servir arquivos estáticos da pasta "public/js/"
app.use("/js", express.static(path.join(__dirname, "public/js")));

// 🔹 Rota principal de teste
app.get("/", (req, res) => {
  res.send("API Airland está rodando 🚀");
});

// 🔹 Middleware para Hotelbeds
app.use("/api/hotelbeds", hotelbedsRoutes);

// 🔹 Exporta o app para a Vercel
export default app;
