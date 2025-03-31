// routes/malga.routes.js
import express from "express";
import { createCharge } from "../api/malgaClient.js"; // ajuste o caminho conforme sua estrutura

const router = express.Router();

// Rota para obter o token do Malga
router.get("/get-client-token", async (req, res) => {
  try {
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
    // Constrói o payload de forma explícita, garantindo a estrutura correta
    const payload = {
      paymentMethod: { paymentType: req.body.paymentMethod }, // Espera que req.body.paymentMethod seja "card"
      paymentToken: req.body.paymentToken,
      amount: req.body.amount,
      installments: req.body.installments,
      customer: req.body.customer,
      billing: req.body.billing,
      extraPassengers: req.body.extraPassengers,
      insuranceSelected: req.body.insuranceSelected,
    };

    const charge = await createCharge(payload);
    // Supondo que a resposta da Malga contenha um atributo "transactionId"
    res.status(201).json({ success: true, transactionId: charge.transactionId, charge });
  } catch (error) {
    console.error("Erro ao criar transação com cartão:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Erro ao criar transação com cartão" });
  }
});

// Rota para criar cobrança via PIX
router.post("/create-pix-payment", async (req, res) => {
  try {
    const payload = {
      paymentMethod: { paymentType: "pix" },
      ...req.body
    };
    const charge = await createCharge(payload);
    res.status(201).json({ success: true, qrCode: charge.qrCode, charge });
  } catch (error) {
    console.error("Erro ao criar cobrança PIX:", error.response ? error.response.data : error.message);
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
    res.status(201).json({ success: true, boletoUrl: charge.boletoUrl, charge });
  } catch (error) {
    console.error("Erro ao criar cobrança boleto:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Erro ao criar cobrança boleto" });
  }
});

export default router;
