// routes/braintreeRoutes.js
import express from "express";
import { gateway } from "../api/braintree.js"; // ajuste o caminho conforme sua estrutura

const router = express.Router();

/*
  Endpoint para gerar o client token.
  Esse token é utilizado no front-end para inicializar as bibliotecas do Braintree,
  seja para Cartão (com ou sem 3DS), PayPal ou Google Pay.
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
  Esse endpoint recebe o nonce final (que pode ser originado de um cartão (com 3DS), PayPal ou Google Pay)
  e os dados da transação, incluindo o valor, informações do cliente, de cobrança e, opcionalmente,
  o número de parcelas (installments).
  
  Note que o campo installments é adicionado condicionalmente se for enviado no corpo da requisição.
  
  O campo merchantAccountId é fixo para sua conta BRL.
*/
router.post("/create-transaction", async (req, res) => {
  const { paymentMethodNonce, amount, customer, billing, installments } = req.body;
  try {
    const saleRequest = {
      amount: amount,
      paymentMethodNonce: paymentMethodNonce,
      merchantAccountId: "7jhfwkgqsgq2fpg", // Sua merchant account para BRL
      // Adiciona o parcelamento se o campo installments estiver presente
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
