import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto"; // Importado para gerar UUID corretamente

// Criando cliente do Supabase com as variáveis de ambiente da Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const app = express();
app.use(express.json());

// 🔹 Função para buscar os domínios permitidos na tabela "affiliates"
async function getAllowedOrigins() {
  try {
    const { data, error } = await supabase.from("affiliates").select("domain");
    if (error) throw error;

    // Remover valores nulos antes de retornar
    return data.map(row => row.domain).filter(domain => domain);
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
      }
    })
  );
})();

// 🔹 Rota dinâmica para detalhes do parque
app.get("/park-details/:id", async (req, res) => {
  const { id } = req.params;
  
  // Aqui você deve fazer a lógica para buscar as informações do parque pelo ID
  const { data, error } = await supabase
    .from("parks")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    return res.status(404).json({ error: "Parque não encontrado" });
  }
  
  // Exemplo de como renderizar o HTML para o cliente (poderia ser um template dinâmico)
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
