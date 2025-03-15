import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config(); // Carrega variáveis de ambiente

const router = express.Router();

// Função para gerar a assinatura X-Signature
function generateSignature() {
    const publicKey = process.env.API_KEY_HH;
    const privateKey = process.env.SECRET_KEY_HH;
    const utcDate = Math.floor(new Date().getTime() / 1000);
    return require("crypto").createHash("sha256").update(publicKey + privateKey + utcDate).digest("hex");
}

// Rota que recebe o pedido do frontend e faz a requisição à API do Hotelbeds
router.post("/", async (req, res) => {
    const url = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";

    const headers = {
        "Api-key": process.env.API_KEY_HH,
        "X-Signature": generateSignature(),
        "Content-Type": "application/json",
    };

    const requestBody = JSON.stringify({
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

    try {
        const response = await fetch(url, {
            method: "POST",
            headers,
            body: requestBody,
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Erro ao buscar hotéis");
        }

        res.json(result);
    } catch (error) {
        console.error("Erro ao buscar hotéis:", error);
        res.status(500).json({ error: error.message || "Erro ao buscar hotéis" });
    }
});

export { router };
