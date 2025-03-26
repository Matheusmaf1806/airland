// pay.routes.js
import express from "express";
import dotenv from "dotenv";
import checkoutNodeJssdk from "@paypal/checkout-server-sdk"; // SDK oficial do PayPal

dotenv.config();

const router = express.Router();

// Ambiente de sandbox ou produção (ajuste conforme necessidade)
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  // Para Sandbox:
  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);

  // Se quiser produção, troque por:
  // return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
}

// Cria o cliente HTTP do PayPal
function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

/**
 * POST /api/create-order
 * Cria a ordem no PayPal e retorna o ID para o front.
 */
router.post("/create-order", async (req, res) => {
  try {
    // Esses campos podem vir do front
    const { amount, currency } = req.body;

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency || "BRL", // "BRL" por padrão
            value: amount || "100.00",        // Valor fixo de exemplo
          },
        },
      ],
    });

    // Executa a criação da ordem
    const response = await client().execute(request);

    // Retorna somente o 'id' da ordem pro front
    return res.status(200).json({ id: response.result.id });
  } catch (err) {
    console.error("Erro em /create-order:", err);
    return res.status(500).json({ error: err.toString() });
  }
});

/**
 * POST /api/capture-order
 * Recebe o orderId do front e faz a captura no PayPal.
 */
router.post("/capture-order", async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "orderId é obrigatório." });
    }

    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    // Executa a captura da ordem
    const response = await client().execute(request);

    // Retorna o resultado completo da transação
    return res.status(200).json(response.result);
  } catch (err) {
    console.error("Erro em /capture-order:", err);
    return res.status(500).json({ error: err.toString() });
  }
});

export default router;
