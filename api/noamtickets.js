import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// 🔹 Proxy para buscar parques da TicketsGenie
router.get("/parques", async (req, res) => {
  try {
    const response = await fetch("https://devapi.ticketsgenie.app/v1/parks", {
      method: "GET",
      headers: {
        "x-api-key": process.env.TICKETSGENIE_API_KEY,
        "x-api-secret": process.env.TICKETSGENIE_API_SECRET,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erro ao buscar dados da API TicketsGenie" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar parques:", error);
    res.status(500).json({ error: "Erro ao buscar parques" });
  }
});

// 🔹 Proxy para buscar um parque específico da TicketsGenie
router.get("/parques/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const response = await fetch(`https://devapi.ticketsgenie.app/v1/parks/${id}`, {
      method: "GET",
      headers: {
        "x-api-key": process.env.TICKETSGENIE_API_KEY,
        "x-api-secret": process.env.TICKETSGENIE_API_SECRET,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erro ao buscar detalhes do parque" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar detalhes do parque:", error);
    res.status(500).json({ error: "Erro ao buscar detalhes do parque" });
  }
});

export default router;
