// routes/braintreeRoutes.js
import express from "express";
import { gateway } from "../api/braintree.js"; // Certifique-se de que o caminho está correto

const router = express.Router();

/*
  Endpoint para gerar o client token.
  Esse token é usado no front-end para inicializar os métodos de pagamento (Cartão, PayPal, Google Pay e 3DS).
*/
router.get("/get-client-token", async (req, res) => {
  try {
    const response = await gateway.clientToken.generate({});
    res.json({ clientToken: response.clientToken });
  } catch (error) {
    console.error("Erro ao gerar client token:", error);
    res.status(500).json({ error: "Erro ao gerar client token" });
  }
});

/*
  Endpoint para criar a transação.
  Recebe o nonce (originado do cartão com 3DS, PayPal ou Google Pay),
  o valor, os dados do cliente, de cobrança e, opcionalmente, o número de parcelas.
  O campo installments é adicionado se enviado.
  O merchantAccountId está fixo para sua conta BRL.
*/
router.post("/create-transaction", async (req, res) => {
  const { paymentMethodNonce, amount, customer, billing, installments } = req.body;
  try {
    const saleRequest = {
      amount: amount,
      paymentMethodNonce: paymentMethodNonce,
      merchantAccountId: "7jhfwkgqsgq2fpg", // Sua Merchant Account para BRL
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
