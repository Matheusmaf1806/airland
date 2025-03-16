///////////////////////////////////////////////////////////
// server.js (ESM) - Versão Final
///////////////////////////////////////////////////////////
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// 1) Carregar variáveis do .env
dotenv.config();

// 2) Resolver __dirname em modo ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3) Criar cliente do Supabase (exemplo)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 4) Inicializar Express
const app = express();
app.use(express.json());
app.use(cors());

// 5) Servir arquivos estáticos a partir de /public
app.use(express.static(path.join(__dirname, "public")));

// ------------------------------------------------------
// IMPORTAR O SEU ROUTER PARA A TICKETS GENIE
// ------------------------------------------------------
import ticketsGenieRouter from "./routes/ticketsgenie.routes.js";
app.use("/api/ticketsgenie", ticketsGenieRouter);

// ------------------------------------------------------
// Rota principal (teste)
app.get("/", (req, res) => {
  res.send("Olá, API rodando com ESM e Express!");
});

// ------------------------------------------------------
// Função para gerar assinatura de requests (Hotelbeds)
function generateSignature() {
  const publicKey  = process.env.API_KEY_HH;     // ex.: "123456..."
  const privateKey = process.env.SECRET_KEY_HH;  // ex.: "abcXYZ..."
  const utcDate    = Math.floor(Date.now() / 1000);
  const assemble   = `${publicKey}${privateKey}${utcDate}`;

  return crypto.createHash("sha256").update(assemble).digest("hex");
}

// ------------------------------------------------------
// Rota GET p/ Hotelbeds, suportando múltiplos quartos
// Exemplo de chamada front-end: GET /api/hotelbeds/hotels?checkIn=2025-06-15&checkOut=2025-06-16&destination=MCO&rooms=2&adults1=2&children1=1&adults2=2&children2=0
app.get("/api/hotelbeds/hotels", async (req, res) => {
  try {
    // 1) Extrair parâmetros
    const { checkIn, checkOut, destination } = req.query;
    const roomsCount = parseInt(req.query.rooms || "1");

    // 2) Montar occupancies[] de acordo com rooms
    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const adParam = `adults${i}`;
      const chParam = `children${i}`;

      const ad = parseInt(req.query[adParam] || "2"); // default 2 adultos
      const ch = parseInt(req.query[chParam] || "0"); // default 0 crianças

      occupancies.push({
        rooms: 1,
        adults: ad,
        children: ch
      });
    }

    // 3) Definir defaults caso faltem params
    const finalCheckIn  = checkIn  || "2025-06-15";
    const finalCheckOut = checkOut || "2025-06-16";
    const finalDest     = destination || "MCO";

    // 4) Gerar assinatura e montar headers
    const signature = generateSignature();
    const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
    const myHeaders = {
      "Api-key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    // 5) Body para POST na Hotelbeds
    const bodyData = {
      stay: {
        checkIn:  finalCheckIn,
        checkOut: finalCheckOut
      },
      occupancies,
      destination: {
        code: finalDest
      }
    };

    // 6) Fazer POST na API
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

    // 7) Devolver resultado ao front-end
    return res.json(result);

  } catch (err) {
    console.error("Erro ao buscar hotéis (GET /api/hotelbeds/hotels):", err);
    res.status(500).json({ error: "Erro interno ao buscar hotéis" });
  }
});

// ------------------------------------------------------
// Exemplo: rota POST para "proxy-hotelbeds" (antiga, opcional)
app.post("/proxy-hotelbeds", async (req, res) => {
  try {
    const signature = generateSignature();
    const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";

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
      return res
        .status(response.status)
        .json({ error: result.error || "Erro na API Hotelbeds" });
    }

    return res.json(result);

  } catch (err) {
    console.error("Erro ao buscar dados dos hotéis (POST /proxy-hotelbeds):", err);
    res.status(500).json({ error: "Erro interno ao buscar hotéis" });
  }
});

// ------------------------------------------------------
// Exemplo: rota dinâmica usando Supabase (busca "parks")
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

// ------------------------------------------------------
// 6) Exportar app p/ a Vercel (sem app.listen duplicado)
export default app;
