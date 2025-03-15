import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import path from "path"; // Para servir arquivos estáticos
import fetch from "node-fetch"; // Para fazer requisições externas
import CryptoJS from "crypto-js"; // Para gerar a assinatura X-Signature
import dotenv from "dotenv"; // Para carregar as variáveis de ambiente

dotenv.config(); // Carrega as variáveis do .env

// 🔹 Criando cliente do Supabase com as variáveis de ambiente da Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const app = express();
app.use(express.json());
app.use(cors()); // Habilita CORS para evitar bloqueios
app.use(express.static(path.join(__dirname, "public"))); // Serve arquivos estáticos da pasta "public"

// 🔹 Chaves da API da Hotelbeds
const apiKey = process.env.API_KEY_HH;
const secretKey = process.env.SECRET_KEY_HH;
const endpoint = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";

// 🔹 Função para gerar a assinatura X-Signature
function generateSignature() {
  const utcDate = Math.floor(new Date().getTime() / 1000);
  const assemble = apiKey + secretKey + utcDate;
  return CryptoJS.SHA256(assemble).toString(CryptoJS.enc.Hex);
}

// 🔹 Rota para buscar dados de hotéis (o frontend chamará esta rota)
app.post("/hotel-data", async (req, res) => {
  try {
    const { destination } = req.body;
    const signature = generateSignature();

    const myHeaders = {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Accept": "application/json",
      "Content-Type": "application/json",
    };

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({
        stay: { checkIn: "2025-06-15", checkOut: "2025-06-16" },
        occupancies: [{ rooms: 1, adults: 1, children: 0 }],
        destination: { code: destination },
      }),
    };

    const response = await fetch(endpoint, requestOptions);
    const data = await response.json();

    res.json(data); // Retorna os dados para o frontend
  } catch (error) {
    console.error("Erro ao buscar hotéis:", error);
    res.status(500).json({ error: "Erro interno ao buscar hotéis" });
  }
});

// 🔹 Rota dinâmica para detalhes do parque
app.get("/park-details/:id", async (req, res) => {
  const { id } = req.params;
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

// 🔹 Rota principal de teste
app.get("/", (req, res) => {
  res.send("API Airland está rodando 🚀");
});

// 🔹 Exporta o app para a Vercel
export default app;
