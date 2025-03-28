// routes/braintreeRoutes.js
import express from "express";
import { gateway } from "../api/braintree.js"; // ajuste o caminho conforme sua estrutura

const router = express.Router();

router.get("/get-client-token", async (req, res) => {
  try {
    const response = await gateway.clientToken.generate({});
    res.json({ clientToken: response.clientToken });
  } catch (error) {
    console.error("Erro ao gerar client token:", error);
    res.status(500).json({ error: "Erro ao gerar client token" });
  }
});

router.post("/create-transaction", async (req, res) => {
  const { paymentMethodNonce, amount, customer, billing, installments } = req.body;
  try {
    const saleRequest = {
      amount: amount,
      paymentMethodNonce: paymentMethodNonce,
      merchantAccountId: "7jhfwkgqsgq2fpg", // Sua merchant account para BRL
      // Se o número de parcelas for enviado, adiciona o campo installments
      ...(installments && { installments: { count: parseInt(installments, 10) } }),
      customer: customer,
      billing: billing,
      options: {
        submitForSettlement: true
      }
    };
    
    const result = await gateway.transaction.sale(saleRequest);
    
    if (result.success) {
      res.json({ success: true, transactionId: result.transaction.id });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Erro ao criar transação Braintree:", error);
    res.status(500).json({ success: false, message: error.toString() });
  }
});

export default router;
