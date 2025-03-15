import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import path from "path"; // Para lidar com arquivos estáticos
import fetch from "node-fetch"; // Para fazer requisição HTTP
import dotenv from "dotenv"; // Para carregar variáveis de ambiente
import crypto from "crypto"; // Módulo nativo do Node.js
import { router as hotelbedsRoutes } from "./api/hotelbeds.js";
import { router as imageProxyRoutes } from "./api/imageProxyhh.js";

// 🔹 Carregar variáveis do .env
dotenv.config();

// 🔹 Criando cliente do Supabase com as variáveis de ambiente
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const app = express();
const PORT = process.env.PORT || 3000; // Mantendo 3000 conforme seu package.json

// 🔹 Middlewares
app.use(express.json());
app.use(cors());
app.use(express.static(path.resolve("public"))); // Servir arquivos estáticos

// 🔹 Função para gerar a assinatura X-Signature
function generateSignature() {
  const publicKey = process.env.API_KEY_HH;
  const privateKey = process.env.SECRET_KEY_HH;

  if (!publicKey || !privateKey) {
    console.error("❌ ERRO: API_KEY_HH ou SECRET_KEY_HH não definidas!");
    return "";
  }

  const utcDate = Math.floor(new Date().getTime() / 1000); // Timestamp UTC
  const assemble = `${publicKey}${privateKey}${utcDate}`;

  return crypto.createHash("sha256").update(assemble).digest("hex");
}

// 🔹 Rota para buscar hotéis via Hotelbeds
app.post("/proxy-hotelbeds", async (req, res) => {
  const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";

  // Gera a assinatura necessária
  const signature = generateSignature();
  if (!signature) {
    return res.status(500).json({ error: "Erro ao gerar assinatura" });
  }

  const myHeaders = {
    "Api-key": process.env.API_KEY_HH,
    "X-Signature": signature,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  const bodyData = {
    stay: {
      checkIn: req.body.checkIn || "2025-06-15",
      checkOut: req.body.checkOut || "2025-06-16",
    },
    occupancies: [{ rooms: 1, adults: 1, children: 0 }],
    destination: { code: req.body.destination || "MCO" },
  };

  try {
    const response = await fetch(url, { method: "POST", headers: myHeaders, body: JSON.stringify(bodyData) });
    const result = await response.json();

    console.log("🔹 Resposta da API Hotelbeds:", result);
    if (response.ok) res.json(result);
    else throw new Error(result.error || "Erro desconhecido na API Hotelbeds");
  } catch (error) {
    console.error("❌ Erro ao buscar hotéis:", error);
    res.status(500).json({ error: "Erro ao buscar dados dos hotéis" });
  }
});

// 🔹 Rota dinâmica para detalhes do parque
app.get("/park-details/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from("parks").select("*").eq("id", id).single();

    if (error) return res.status(404).json({ error: "Parque não encontrado" });

    const parkDetails = `
      <html>
        <head><title>${data.name} - Walt Disney World Resort</title></head>
        <body>
          <h1>${data.name}</h1>
          <p>${data.description}</p>
          <img src="${data.images.cover}" alt="${data.name}" />
        </body>
      </html>
    `;
    res.send(parkDetails);
  } catch (error) {
    console.error("❌ Erro ao buscar parque:", error);
    res.status(500).json({ error: "Erro ao buscar parque" });
  }
});

// 🔹 Rota de teste
app.get("/", (req, res) => res.send("🚀 API Airland rodando!"));

// 🔹 Integrando as rotas
app.use("/api/hotelbeds", hotelbedsRoutes);
app.use("/api/image-proxy", imageProxyRoutes);

// 🔹 Inicia o servidor
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));

export default app;
