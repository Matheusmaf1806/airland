// routes/pay.routes.js
import express from 'express';
import dotenv from 'dotenv';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

dotenv.config();

const router = express.Router();

// Configura o ambiente do PayPal (Sandbox ou Live)
let environment;
if (process.env.NODE_ENV === 'production') {
  environment = new checkoutNodeJssdk.core.LiveEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
} else {
  environment = new checkoutNodeJssdk.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
}

const paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

// Endpoint para criar uma ordem
router.post('/create-order', async (req, res) => {
  try {
    // Dados enviados do front (nome, e-mail, endereço e valor)
    const { firstName, lastName, email, address, amount } = req.body;
    
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      application_context: {
        shipping_preference: "NO_SHIPPING", // Não solicitar endereço de envio
        user_action: "PAY_NOW"
      },
      purchase_units: [
        {
          reference_id: "default",
          amount: {
            currency_code: "BRL",
            value: amount,
            breakdown: {
              item_total: {
                currency_code: "BRL",
                value: amount
              }
            }
          }
          // Se necessário, adicione billing details aqui utilizando os dados coletados
        }
      ]
    });
    
    const order = await paypalClient.execute(request);
    res.status(200).json(order.result);
  } catch (err) {
    console.error("Erro ao criar a ordem:", err);
    res.status(500).json({ error: err.toString() });
  }
});

// Endpoint para capturar uma ordem
router.post('/capture-order', async (req, res) => {
  try {
    const { orderID } = req.body;
    if (!orderID) {
      return res.status(400).json({ error: "orderID é obrigatório" });
    }
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const capture = await paypalClient.execute(request);
    res.status(200).json(capture.result);
  } catch (err) {
    console.error("Erro ao capturar a ordem:", err);
    res.status(500).json({ error: err.toString() });
  }
});

export default router;
