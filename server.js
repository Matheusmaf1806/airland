///////////////////////////////////////////////////////////
// server.js (ESM) - Exemplo completo
///////////////////////////////////////////////////////////
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

///////////////////////////////////////////////////////////
// 1) Carregar variáveis do .env (ou configuradas na Vercel)
///////////////////////////////////////////////////////////
dotenv.config(); // dotenv carrega as variáveis de ambiente

///////////////////////////////////////////////////////////
// 2) Resolver __dirname em modo ESM
///////////////////////////////////////////////////////////
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

///////////////////////////////////////////////////////////
// 3) Criar cliente do Supabase (exemplo)
///////////////////////////////////////////////////////////
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY
);

///////////////////////////////////////////////////////////
// 4) Inicializar Express
///////////////////////////////////////////////////////////
const app = express();
app.use(express.json());
app.use(cors());

///////////////////////////////////////////////////////////
// 5) Servir arquivos estáticos a partir de /public
///////////////////////////////////////////////////////////
// Agora todos os arquivos dentro de "public/" ficarão disponíveis.
// Exemplo: "public/js/parks-list.js" -> acessível em "/js/parks-list.js"
app.use(express.static(path.join(__dirname, "public")));

///////////////////////////////////////////////////////////
// Exemplo: rota principal
///////////////////////////////////////////////////////////
app.get("/", (req, res) => {
  res.send("Olá, API rodando com ESM e Express!");
});

app.get("/api/ticketsgenie/parks", (req, res) => {
  // Exemplo de resposta simples:
  const parks = [
    { name: "Disney Orlando", location: "Orlando" },
    { name: "Universal Orlando", location: "Orlando" }
    // ...
  ];
  res.json({ parks });
});

///////////////////////////////////////////////////////////
// Exemplo: Função para gerar assinatura de requests (Hotelbeds)
///////////////////////////////////////////////////////////
function generateSignature() {
  const publicKey  = process.env.API_KEY_HH;    // Ajuste
  const privateKey = process.env.SECRET_KEY_HH; // Ajuste
  const utcDate    = Math.floor(Date.now() / 1000);
  const assemble   = `${publicKey}${privateKey}${utcDate}`;

  return crypto.createHash("sha256").update(assemble).digest("hex");
}

///////////////////////////////////////////////////////////
// Exemplo: rota POST para "proxy-hotelbeds"
///////////////////////////////////////////////////////////
app.post("/proxy-hotelbeds", async (req, res) => {
  try {
    const signature = generateSignature();
    const url       = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";

    const myHeaders = {
      "Api-key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    // Corpo (exemplo)
    const bodyData = {
      stay: {
        checkIn:  req.body.checkIn  || "2025-06-15",
        checkOut: req.body.checkOut || "2025-06-16"
      },
      occupancies: [
        {
          rooms:    1,
          adults:   1,
          children: 0
        }
      ],
      destination: {
        code: req.body.destination || "MCO"
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(bodyData)
    });

    const result = await response.json();
    if (!response.ok) {
      // Se a API retornou status >= 400
      return res
        .status(response.status)
        .json({ error: result.error || "Erro na API Hotelbeds" });
    }

    // Se tudo certo, devolve JSON ao front-end
    return res.json(result);

  } catch (err) {
    console.error("Erro ao buscar dados dos hotéis:", err);
    res.status(500).json({ error: "Erro interno ao buscar hotéis" });
  }
});

///////////////////////////////////////////////////////////
// Exemplo: rota dinâmica usando Supabase (busca "parks")
///////////////////////////////////////////////////////////
app.get("/park-details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("parks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Parque não encontrado" });
    }

    // Exemplo de HTML simples
    const parkDetails = `
      <html>
        <head><title>${data.name}</title></head>
        <body>
          <h1>${data.name}</h1>
          <p>${data.description}</p>
          <img src="${data.images.cover}" alt="${data.name}" />
        </body>
      </html>
    `;
    res.send(parkDetails);

  } catch (err) {
    console.error("Erro ao buscar parque:", err);
    res.status(500).json({ error: "Erro interno ao buscar parque" });
  }
});

///////////////////////////////////////////////////////////
// 6) Exportar app para a Vercel (sem app.listen duplicado)
///////////////////////////////////////////////////////////
// Na Vercel, não chamamos app.listen() diretamente.
// Basta exportar:
export default app;
