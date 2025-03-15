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

// 🔹 Configuração correta para servir arquivos na Vercel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Inicializar Express
const app = express();

// 🔹 Criar cliente do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 🔹 Middlewares
app.use(express.json());
app.use(cors()); // Evita problemas de CORS
app.use(express.static(path.join(__dirname, "public"))); // Serve arquivos estáticos da pasta "public"
app.use("/js", express.static(path.join(__dirname, "public/js"))); // Serve arquivos JS corretamente

// 🔹 Proxy para TicketsGenie (evita erro de CORS)
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

// 🔹 Rota para buscar detalhes de um parque
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

// 🔹 Rota para listar produtos de um parque
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

// 🔹 Rota principal de teste
app.get("/", (req, res) => {
  res.send("API Airland está rodando 🚀");
});

// 🔹 Middleware para Hotelbeds
app.use("/api/hotelbeds", hotelbedsRoutes);

// 🔹 Exporta o app para a Vercel
export default app;
