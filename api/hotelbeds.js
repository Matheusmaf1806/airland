import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Função para gerar a assinatura X-Signature da API Hotelbeds
function generateSignature() {
  const publicKey = process.env.API_KEY_HH;
  const privateKey = process.env.SECRET_KEY_HH;
  const utcDate = Math.floor(new Date().getTime() / 1000);
  const assemble = `${publicKey}${privateKey}${utcDate}`;
  return crypto.createHash("sha256").update(assemble).digest("hex");
}

// Proxy para buscar hotéis via Hotelbeds com paginação
router.get("/hotels", async (req, res) => {
  const { checkIn, checkOut, destination, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit; // Deslocamento para paginação

  const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
  const signature = generateSignature();

  const myHeaders = {
    "Api-key": process.env.API_KEY_HH,
    "X-Signature": signature,
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  const bodyData = {
    stay: { checkIn, checkOut },
    occupancies: [{ rooms: 1, adults: 2, children: 0 }],
    destination: { code: destination },
    limit,
    offset
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(bodyData)
    });

    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: result.error || "Erro desconhecido na API Hotelbeds"
      });
    }

    res.json(result); // Retornar o resultado para o frontend
  } catch (error) {
    console.error("Erro ao buscar hotéis:", error);
    res.status(500).json({ error: "Erro ao buscar dados dos hotéis" });
  }
});

export default router;
