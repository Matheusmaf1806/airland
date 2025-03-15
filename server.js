import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import fetch from "node-fetch";
import crypto from "crypto";
import supabaseClient from "./api/supabaseClient.js"; // 🔹 Módulo para conexão com Supabase
import hbhospRoutes from "./api/hbhosp.js";  // 🔹 Proxy Hotelbeds (Busca de Hotéis)
import noamticketsRoutes from "./api/noamtickets.js";  // 🔹 Proxy TicketsGenie (Ingressos)

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Middlewares
app.use(express.json());
app.use(cors()); // Habilita CORS
app.use(express.static(path.join(process.cwd(), "public")));  // 🔹 Serve arquivos estáticos corretamente

// 🔹 Rotas Modulares
app.use("/api/hoteis", hbhospRoutes);
app.use("/api/ingressos", noamticketsRoutes);

// 🔹 Rota dinâmica para detalhes do parque (usando Supabase)
app.get("/park-details/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseClient
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

// 🔹 Rota Principal de Teste
app.get("/", (req, res) => {
  res.send("API Airland está rodando 🚀");
});

// 🔹 Iniciar o Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

export default app;
