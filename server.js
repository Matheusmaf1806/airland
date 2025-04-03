///////////////////////////////////////////////////////////
// server.js (ESM) - Versão Final Integrando Hotelbeds,
// PayPal, Braintree, Malga (tokenização + 3DS) e hbacti,
// com rota /checkout para form-handling-tokenization.
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

// 2) Resolver __filename em modo ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3) Criar cliente do Supabase (exemplo)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 4) Inicializar Express
const app = express();
app.use(cors());

// Caso você queira receber tanto JSON quanto dados de form-urlencoded
// (por exemplo, se o formulário Malga estiver enviando dados via POST):
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5) Servir arquivos estáticos a partir de /public
app.use(express.static(path.join(__dirname, "public")));

// ------------------------------------------------------
// IMPORTAR ROTAS EXISTENTES
// ------------------------------------------------------
import ticketsGenieRouter from "./routes/ticketsgenie.routes.js";
import hbdetailRouter from "./routes/hbdetail.js";
import cartRoutes from "./routes/cart.routes.js";
import getLatestDollar from "./routes/getLatestDollar.js";
import userRoutes from "./routes/user.routes.js";
import { getAffiliateColors } from "./routes/affiliateColors.js";
import payRouter from "./routes/pay.routes.js"; // Rota de pagamento (PayPal ou outra)

// ------------- Rotas da Malga: Tokenização + 3DS -----------
import { malgaRouter } from "./routes/malga.routes.js";

// Exemplo Braintree
import { gateway } from "./api/braintree.js";

// ------------------------------------------------------
// IMPORTAR ROTA EXEMPLO DE HOTELBEDS ACTIVITIES (hbacti)
// ------------------------------------------------------
import hbactiRouter from "./routes/hbacti.js";

// ------------------------------------------------------
// Vincular as rotas
// ------------------------------------------------------
app.use("/api/ticketsgenie", ticketsGenieRouter);
app.use("/api/hbdetail", hbdetailRouter);
app.use("/api", cartRoutes);
app.get("/api/getLatestDollar", getLatestDollar);
app.use("/api/users", userRoutes);
app.get("/api/affiliateColors", getAffiliateColors);
app.use("/api/pay", payRouter);        // Rota PayPal
app.use("/api/malga", malgaRouter);    // Rota Malga (tokenização + 3DS)
app.use("/api/hbacti", hbactiRouter);  // Rota de atividades (Hotelbeds Activities)

// ------------------------------------------------------
// ROTA PRINCIPAL (teste)
app.get("/", (req, res) => {
  res.send("Olá, API rodando com ESM, Express e integrações Hotelbeds, PayPal, Braintree e Malga!");
});

// ------------------------------------------------------
// Rota /checkout (Exemplo da form-handling-tokenization)
app.post("/checkout", async (req, res) => {
  try {
    // Se o token estiver funcionando, aqui você terá algo como:
    // {
    //   holderName: "Nome Exemplo",
    //   number: "tok_xxx",
    //   expirationDate: "12/30",
    //   cvv: "tok_yyy"
    // }
    console.log("Dados recebidos do formulário Malga:", req.body);

    // Mande de volta só para teste/visualização
    return res.json({ data: JSON.stringify(req.body, null, 2) });
  } catch (error) {
    console.error("Erro no /checkout:", error);
    return res.json({ status: "failed", error: error.message });
  }
});

// ------------------------------------------------------
// Função para gerar assinatura (Hotelbeds - Hotels API)
function generateSignature() {
  const publicKey = process.env.API_KEY_HH;     // ex.: "123456..."
  const privateKey = process.env.SECRET_KEY_HH; // ex.: "abcXYZ..."
  const utcDate = Math.floor(Date.now() / 1000);
  const assemble = `${publicKey}${privateKey}${utcDate}`;
  return crypto.createHash("sha256").update(assemble).digest("hex");
}

// ------------------------------------------------------
// Rota GET para Preço / Disponibilidade (Hotelbeds - Hotels)
app.get("/api/hotelbeds/hotels", async (req, res) => {
  try {
    const { checkIn, checkOut, destination } = req.query;
    const roomsCount = parseInt(req.query.rooms || "1");

    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const adParam = `adults${i}`;
      const chParam = `children${i}`;
      const ad = parseInt(req.query[adParam] || "2");
      const ch = parseInt(req.query[chParam] || "0");
      occupancies.push({ rooms: 1, adults: ad, children: ch });
    }

    const finalCheckIn = checkIn || "2025-06-15";
    const finalCheckOut = checkOut || "2025-06-16";
    const finalDest = destination || "MCO";

    const signature = generateSignature();
    const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
    const myHeaders = {
      "Api-key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    const bodyData = {
      stay: { checkIn: finalCheckIn, checkOut: finalCheckOut },
      occupancies,
      destination: { code: finalDest }
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
        .json({ error: result.error || "Erro na API Hotelbeds (Booking)" });
    }
    return res.json(result);
  } catch (err) {
    console.error("Erro ao buscar hotéis:", err);
    res.status(500).json({ error: "Erro interno ao buscar hotéis" });
  }
});

// ------------------------------------------------------
// Rota GET para Conteúdo Detalhado (Hotelbeds - Content)
app.get("/api/hotelbeds/hotel-content", async (req, res) => {
  try {
    const { hotelCode } = req.query;
    if (!hotelCode) {
      return res
        .status(400)
        .json({ error: "O parâmetro 'hotelCode' é obrigatório." });
    }

    const signature = generateSignature();
    const url = `https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels/${hotelCode}`;
    const headers = {
      "Api-key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    const response = await fetch(url, { method: "GET", headers });
    const result = await response.json();
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: result.error || "Erro na API Hotelbeds (Content)" });
    }
    return res.json(result);
  } catch (err) {
    console.error("Erro ao buscar conteúdo detalhado do hotel:", err);
    res.status(500).json({ error: "Erro interno ao buscar conteúdo detalhado do hotel" });
  }
});

// ------------------------------------------------------
// Rota POST para "proxy-hotelbeds" (antiga, opcional)
app.post("/proxy-hotelbeds", async (req, res) => {
  try {
    const signature = generateSignature();
    const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
    const myHeaders = {
      "Api-key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Content-Type": "application/json",
      Accept: "application/json"
    };

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

// ------------------------------------------------------
// BRAINTREE EXEMPLO
// ------------------------------------------------------
app.get("/api/braintree/get-client-token", async (req, res) => {
  try {
    const response = await gateway.clientToken.generate({});
    res.json({ clientToken: response.clientToken });
  } catch (error) {
    console.error("Erro ao gerar client token Braintree:", error);
    res.status(500).json({ error: "Erro ao gerar client token" });
  }
});

app.post("/api/braintree/create-transaction", async (req, res) => {
  const { paymentMethodNonce, amount } = req.body;
  try {
    const saleRequest = {
      amount,
      paymentMethodNonce,
      options: {
        submitForSettlement: true
      }
    };
    const result = await gateway.transaction.sale(saleRequest);
    if (result.success) {
      return res.json({ success: true, transactionId: result.transaction.id });
    } else {
      return res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Erro ao criar transação Braintree:", error);
    res.status(500).json({ success: false, message: error.toString() });
  }
});

// ------------------------------------------------------
// Subir o servidor localmente (para ambiente não-serverless)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Export default para eventuais usos (não é obrigatório)
export default app;
