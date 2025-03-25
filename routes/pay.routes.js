// routes/pay.routes.js

import { Router } from "express";
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

// Função para criar o cliente do PayPal (Sandbox)
function paypalClient() {
  const environment = new checkoutNodeJssdk.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment);
}

// Endpoint para pagamento inline (direto com dados do cartão e parcelamento)
router.post("/", async (req, res) => {
  try {
    const {
      amount,
      currency,
      cardholderName,
      cardNumber,
      expiry,         // Formato: "YYYY-MM", ex: "2025-12"
      securityCode,
      billingAddress,
      installmentsCount  // Número de parcelas, ex: 3
    } = req.body;

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { 
          currency_code: currency || "USD", 
          value: amount || "100.00" 
        }
      }],
      payment_instruction: {
        installments: {
          count: installmentsCount || 1
        }
      },
      payment_source: {
        card: {
          name: cardholderName,
          number: cardNumber,
          expiry: expiry,
          security_code: securityCode,
          billing_address: billingAddress
        }
      }
    });
    
    const paypalHttpClient = paypalClient();
    const response = await paypalHttpClient.execute(request);
    return res.status(200).json(response.result);
  } catch (err) {
    console.error("Erro ao processar o pagamento:", err);
    return res.status(500).json({ error: err.toString() });
  }
});

export default router;
