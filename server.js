import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import path from "path"; // Para lidar com caminhos de arquivos estáticos
import { getHotelData } from './api/hht.js';  // Importa a função que vai fazer a requisição para Hotelbeds

// Criando cliente do Supabase com as variáveis de ambiente da Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

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

// 🔹 Nova Rota para buscar dados do Hotelbeds
app.get('/hotel-data', async (req, res) => {
  try {
    const destination = req.query.destination || 'MCO';  // Define um destino padrão (Orlando)
    const hotelData = await getHotelData(destination);  // Chama a função para buscar os dados
    res.json(hotelData);  // Retorna os dados recebidos da API
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Rota principal de teste
app.get("/", (req, res) => {
  res.send("API Airland está rodando 🚀");
});

// 🔹 Exporta o app para a Vercel
export default app;
