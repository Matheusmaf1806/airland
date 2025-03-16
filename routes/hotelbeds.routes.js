// routes/hotelbeds.routes.js
import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

function generateSignature() {
  const apiKey = process.env.API_KEY_HH;
  const secret = process.env.SECRET_KEY_HH;
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToSign = `${apiKey}${secret}${timestamp}`;
  return crypto.createHash("sha256").update(dataToSign).digest("hex");
}

const router = Router();

// GET /api/hotelbeds/hotels
router.get("/hotels", async (req, res) => {
  try {
    const { checkIn, checkOut, destination } = req.query;
    const roomsCount = parseInt(req.query.rooms || "1");

    let occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      const adParam = `adults${i}`;
      const chParam = `children${i}`;

      const ad = parseInt(req.query[adParam] || "2");
      const ch = parseInt(req.query[chParam] || "0");

      occupancies.push({
        rooms: 1,
        adults: ad,
        children: ch
      });
    }

    const finalCheckIn  = checkIn  || "2025-06-15";
    const finalCheckOut = checkOut || "2025-06-16";
    const finalDest     = destination || "MCO";

    const signature = generateSignature();
    const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
    const myHeaders = {
      "Api-key": process.env.API_KEY_HH,
      "X-Signature": signature,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

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
    console.error("Erro ao buscar hotéis:", err);
    res.status(500).json({ error: "Erro interno ao buscar hotéis" });
  }
});

export default router;
