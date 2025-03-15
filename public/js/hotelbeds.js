import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// 🔹 Função para gerar a assinatura X-Signature
function generateSignature() {
  const publicKey = process.env.API_KEY_HH;
  const privateKey = process.env.SECRET_KEY_HH;
  const utcDate = Math.floor(new Date().getTime() / 1000);
  return crypto.createHash("sha256").update(publicKey + privateKey + utcDate).digest("hex");
}

// 🔹 Rota para buscar dados de hotéis via Hotelbeds
router.post("/", async (req, res) => {
  const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";

  const myHeaders = {
    "Api-key": process.env.API_KEY_HH,
    "X-Signature": generateSignature(),
    "Content-Type": "application/json",
  };

  const raw = JSON.stringify({
    stay: {
      checkIn: req.body.checkIn || "2025-06-15",
      checkOut: req.body.checkOut || "2025-06-16",
    },
    occupancies: [
      {
        rooms: 1,
        adults: 1,
        children: 0,
      },
    ],
    destination: {
      code: req.body.destination || "MCO",
    },
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
  };

  try {
    const response = await fetch(url, requestOptions);
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar hotéis:", error);
    res.status(500).json({ error: "Erro ao buscar hotéis" });
  }
});

export { router };
