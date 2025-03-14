import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import path from "path"; // Para lidar com caminhos de arquivos estáticos
import fetch from "node-fetch"; // Para fazer requisição HTTP
import dotenv from "dotenv"; // Para carregar variáveis de ambiente

// Carregar variáveis do .env
dotenv.config();

// Criando cliente do Supabase com as variáveis de ambiente da Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));  // Serve arquivos estáticos da pasta "public"

// 🔹 Função para gerar a assinatura X-Signature
function generateSignature() {
  try {
    const publicKey = process.env.API_KEY_HH;
    const privateKey = process.env.SECRET_KEY_HH;
    const utcDate = Math.floor(new Date().getTime() / 1000); // Timestamp UTC (em segundos)
    const assemble = `${publicKey}${privateKey}${utcDate}`; // Combina os dados necessários para gerar a assinatura

    // Criptografia SHA-256 da combinação
    const hash = crypto.createHash("sha256").update(assemble).digest("hex");
    return hash;
  } catch (error) {
    console.error("Erro ao gerar assinatura:", error);
    throw new Error("Erro ao gerar assinatura");
  }
}

// 🔹 Rota para buscar dados de hotéis via Hotelbeds
app.post("/proxy-hotelbeds", async (req, res) => {
  try {
    const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
    const myHeaders = new Headers();
    myHeaders.append("Api-key", process.env.API_KEY_HH);
    myHeaders.append("X-Signature", generateSignature());
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      stay: {
        checkIn: req.body.checkIn || "2025-06-15", // Padrão para o check-in
        checkOut: req.body.checkOut || "2025-06-16", // Padrão para o check-out
      },
      occupancies: [
        {
          rooms: 1,
          adults: 1,
          children: 0,
        },
      ],
      destination: {
        code: req.body.destination || "MCO", // Padrão para Orlando (MCO)
      },
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const response = await fetch(url, requestOptions);
    const result = await response.json();
    console.log(result); // Log da resposta para debug
    if (result.error) {
      throw new Error(result.error);
    }
    res.json(result); // Retorna os dados recebidos da API Hotelbeds
  } catch (error) {
    console.error("Erro ao buscar dados dos hotéis:", error);
    res.status(500).json({ error: "Erro ao buscar dados dos hotéis" });
  }
});

// 🔹 Rota dinâmica para detalhes do parque
app.get("/park-details/:id", async (req, res) => {
  const { id } = req.params;

  try {
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
  } catch (error) {
    console.error("Erro ao buscar parque:", error);
    res.status(500).json({ error: "Erro ao buscar parque" });
  }
});

// Rota principal de teste
app.get("/", (req, res) => {
  res.send("API Airland está rodando 🚀");
});

// Inicia o servidor na porta 3000 ou na porta configurada pela Vercel
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;
