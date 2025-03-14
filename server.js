import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import path from "path"; // Para lidar com caminhos de arquivos estáticos
import fetch from "node-fetch"; // Para fazer a requisição HTTP
import dotenv from "dotenv"; // Para carregar as variáveis de ambiente
dotenv.config();

// Criando cliente do Supabase com as variáveis de ambiente da Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const app = express();
app.use(express.json());

// Serve arquivos estáticos da pasta "public" (os arquivos precisam estar dentro dessa pasta)
app.use(express.static(path.join(__dirname, "public")));

// 🔹 Função para buscar os domínios permitidos na tabela "affiliates"
async function getAllowedOrigins() {
  try {
    const { data, error } = await supabase.from("affiliates").select("domain");
    if (error) throw error;

    // Remover valores nulos antes de retornar
    return data.map((row) => row.domain).filter((domain) => domain);
  } catch (err) {
    console.error("Erro ao buscar domínios permitidos:", err);
    return [];
  }
}

// 🔹 Configuração do CORS com base na tabela `affiliates`
(async function configureCors() {
  const allowedOrigins = await getAllowedOrigins();
  console.log("Domínios permitidos:", allowedOrigins);

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error("Origin not allowed by CORS"));
        }
      },
    })
  );
})();

// 🔹 Rota para buscar dados de hotéis via Hotelbeds
app.post("/proxy-hotelbeds", async (req, res) => {
  const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
  const myHeaders = new Headers();
  myHeaders.append("Api-key", process.env.API_KEY_HH);
  myHeaders.append("X-Signature", generateSignature());
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    stay: {
      checkIn: req.body.checkIn || "2025-06-15", // Pode ser dinâmico a partir do corpo da requisição
      checkOut: req.body.checkOut || "2025-06-16",
    },
    occupancies: [
      {
        rooms: 1,
        adults: 1,
        children: 0,
      },
    ],
    destination: {
      code: req.body.destination || "MCO", // Padrão para Orlando
    },
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  try {
    const response = await fetch(url, requestOptions);
    const result = await response.json();
    res.json(result); // Retorna os dados recebidos da API Hotelbeds
  } catch (error) {
    console.error("Erro ao buscar dados dos hotéis:", error);
    res.status(500).json({ error: "Erro ao buscar dados dos hotéis" });
  }
});

// 🔹 Função para gerar a assinatura X-Signature
function generateSignature() {
  const publicKey = process.env.API_KEY_HH;
  const privateKey = process.env.SECRET_KEY_HH;
  const utcDate = Math.floor(new Date().getTime() / 1000); // Timestamp UTC (em segundos)
  const assemble = `${publicKey}${privateKey}${utcDate}`; // Combina os dados necessários para gerar a assinatura

  // Criptografia SHA-256 da combinação
  const hash = require("crypto")
    .createHash("sha256")
    .update(assemble)
    .digest("hex");
  return hash;
}

// 🔹 Rota dinâmica para detalhes do parque
app.get("/park-details/:id", async (req, res) => {
  const { id } = req.params;

  // Busca as informações do parque pelo ID
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
});

// Rota principal de teste
app.get("/", (req, res) => {
  res.send("API Airland está rodando 🚀");
});

// 🔹 Exporta o app para a Vercel
export default app;
