// api/create-order.js
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { paypalClient } from './paypalClient'; // Certifique-se de ter esse arquivo configurado

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  
  const { amount, currency, checkoutData } = req.body;
  
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  
  // Monta o corpo da requisição
  let requestBody = {
    intent: "CAPTURE",
    purchase_units: [{
      amount: { 
        currency_code: currency || "BRL", 
        value: amount || "100.00"
      }
    }],
    application_context: {
      return_url: process.env.RETURN_URL || "http://localhost:3000/return",
      cancel_url: process.env.CANCEL_URL || "http://localhost:3000/cancel"
    }
  };
  
  // Se os dados do cartão forem enviados, inclui a payment_source no payload
  if (checkoutData && checkoutData.cardDetails) {
    const card = checkoutData.cardDetails;
    requestBody.payment_source = {
      card: {
        number: card.number,
        expiry: card.expiration,
        security_code: card.csc,
        name: checkoutData.firstName + " " + checkoutData.lastName
      }
    };
  }
  
  request.requestBody(requestBody);
  
  try {
    const response = await paypalClient().execute(request);
    // Retorna toda a resposta (incluindo os links do HATEOAS, se houver)
    res.status(200).json(response.result);
  } catch (err) {
    console.error("Erro ao criar pedido no PayPal:", err);
    res.status(500).json({ error: err.toString() });
  }
}
