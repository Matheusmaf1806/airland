// routes/malga.routes.js
import express from "express";
import { createCharge } from "../api/malgaClient.js"; // ajuste o caminho conforme sua estrutura

const router = express.Router();

// Rota para obter o token do Malga
router.get("/get-client-token", async (req, res) => {
  try {
    // Se você tiver uma função real para obter o token, substitua a linha abaixo
    const dummyToken = "dummy-malga-client-token";
    res.json({ clientToken: dummyToken });
  } catch (error) {
    console.error("Erro ao obter token do Malga:", error);
    res.status(500).json({ error: "Erro interno ao obter token" });
  }
});

// Rota para criar transação via cartão (com 3DS, se aplicável)
router.post("/create-transaction", async (req, res) => {
  try {
    // Junta os dados recebidos com o objeto que indica pagamento via cartão
    const payload = {
      paymentMethod: { paymentType: "card" },
      ...req.body
    };
    const charge = await createCharge(payload);
    // Supondo que a resposta da Malga contenha um atributo "transactionId"
    res.status(201).json({ success: true, transactionId: charge.transactionId, charge });
  } catch (error) {
    console.error("Erro ao criar transação com cartão:", error);
    res.status(500).json({ error: "Erro ao criar transação com cartão" });
  }
});

// Rota para criar cobrança via PIX
router.post("/create-pix-payment", async (req, res) => {
  try {
    // Junta os dados recebidos com o objeto que indica pagamento via PIX
    const payload = {
      paymentMethod: { paymentType: "pix" },
      ...req.body
    };
    const charge = await createCharge(payload);
    // Supondo que a resposta da Malga contenha um atributo "qrCode"
    res.status(201).json({ success: true, qrCode: charge.qrCode, charge });
  } catch (error) {
    console.error("Erro ao criar cobrança PIX:", error);
    res.status(500).json({ error: "Erro ao criar cobrança PIX" });
  }
});

// Rota para criar cobrança via boleto
router.post("/create-boleto", async (req, res) => {
  try {
    const payload = {
      paymentMethod: { paymentType: "boleto" },
      ...req.body
    };
    const charge = await createCharge(payload);
    // Supondo que a resposta da Malga contenha um atributo "boletoUrl"
    res.status(201).json({ success: true, boletoUrl: charge.boletoUrl, charge });
  } catch (error) {
    console.error("Erro ao criar cobrança boleto:", error);
    res.status(500).json({ error: "Erro ao criar cobrança boleto" });
  }
});

export default router;
