// server.js (ESM)
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import crypto from "crypto";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// 1) Carregar variáveis de ambiente (na Vercel você configura no Dashboard)
dotenv.config();

// 2) Resolver __dirname em modo ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3) Criar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 4) Iniciar Express
const app = express();
app.use(express.json());
app.use(cors());

// 5) Servir estáticos da pasta /public
app.use(express.static(path.join(__dirname, "public")));

// 6) Exemplo de rota principal
app.get("/", (req, res) => {
  res.send("Hello from ESM + Express on Vercel!");
});

// Exemplo de função (Hotelbeds) para assinar requests
function generateSignature() {
  const publicKey  = process.env.API_KEY_HH;    // Exemplo
  const privateKey = process.env.SECRET_KEY_HH; // Exemplo
  const utcDate    = Math.floor(Date.now() / 1000); 
  const assemble   = `${publicKey}${privateKey}${utcDate}`;

  return crypto.createHash("sha256").update(assemble).digest("hex");
}

// Exemplo de rota POST para "proxy-hotelbeds"
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
        checkIn: req.body.checkIn || "2025-06-15",
        checkOut: req.body.checkOut || "2025-06-16"
      },
      occupancies: [{ rooms: 1, adults: 1, children: 0 }],
      destination: { code: req.body.destination || "MCO" }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(bodyData)
    });

    const result = await response.json();
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: result.error || "Erro na API Hotelbeds" });
    }

    return res.json(result);
  } catch (err) {
    console.error("Erro ao buscar dados dos hotéis:", err);
    res.status(500).json({ error: "Erro interno ao buscar hotéis" });
  }
});

// Exemplo de rota dinâmica usando Supabase
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

    // Exemplo enviando HTML
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

// 7) Não fazemos app.listen() se estivermos na Vercel
//    A Vercel internamente faz esse bind. Basta exportar:
export default app;
