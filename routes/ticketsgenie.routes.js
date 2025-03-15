// routes/ticketsgenie.routes.js
import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

// 1) Listar parques
router.get("/parks", async (req, res) => {
  try {
    const myHeaders = {
      "x-api-key": "1234567890",    
      "x-api-secret": "Magic Lamp"
    };
    const response = await fetch("https://devapi.ticketsgenie.app/v1/parks", {
      method: "GET",
      headers: myHeaders
    });

    if (!response.ok) {
      throw new Error(`Erro na API (status: ${response.status})`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Erro ao buscar parques:", error);
    res.status(500).json({ error: "Erro interno ao buscar parques" });
  }
});

// 2) Listar produtos do parque
router.get("/parks/:parkId/products", async (req, res) => {
  try {
    const { parkId } = req.params;
    const myHeaders = {
      "x-api-key": "1234567890",
      "x-api-secret": "Magic Lamp"
    };

    const url = `https://devapi.ticketsgenie.app/v1/parks/${parkId}/products`;
    const response = await fetch(url, {
      headers: myHeaders
    });

    if (!response.ok) {
      throw new Error(`Erro na API (status: ${response.status})`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Erro ao buscar produtos do parque:", error);
    res.status(500).json({ error: "Erro interno ao buscar produtos" });
  }
});

// 3) Calendário de preços do produto
router.get("/parks/:parkId/products/:productId/calendar", async (req, res) => {
  try {
    const { parkId, productId } = req.params;
    const myHeaders = {
      "x-api-key": "1234567890",
      "x-api-secret": "Magic Lamp"
    };

    const url = `https://devapi.ticketsgenie.app/v1/parks/${parkId}/products/${productId}/calendar`;
    const response = await fetch(url, {
      headers: myHeaders
    });

    if (!response.ok) {
      throw new Error(`Erro na API (status: ${response.status})`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Erro ao buscar calendário:", error);
    res
      .status(500)
      .json({ error: "Erro interno ao buscar calendário de preços" });
  }
});

export default router;
