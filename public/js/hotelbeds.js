import fetch from "node-fetch";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { destination } = req.body;
  if (!destination) return res.status(400).json({ error: "Destino é obrigatório" });

  const apiKey = process.env.API_KEY_HH;
  const secretKey = process.env.SECRET_KEY_HH;
  const utcDate = Math.floor(new Date().getTime() / 1000);
  const signature = CryptoJS.SHA256(apiKey + secretKey + utcDate).toString(CryptoJS.enc.Hex);

  const headers = {
    "Api-key": apiKey,
    "X-Signature": signature,
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    stay: { checkIn: "2025-06-15", checkOut: "2025-06-16" },
    occupancies: [{ rooms: 1, adults: 1, children: 0 }],
    destination: { code: destination },
  });

  try {
    const response = await fetch("https://api.test.hotelbeds.com/hotel-api/1.0/hotels", {
      method: "POST",
      headers,
      body,
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar hotéis:", error);
    res.status(500).json({ error: "Erro interno ao buscar hotéis" });
  }
}
