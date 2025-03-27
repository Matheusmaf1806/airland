// api/create-order.js
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { paypalClient } from './paypalClient';

// Função auxiliar para converter o vencimento do cartão de "MM/AA" para "YYYY-MM"
function convertExpiration(expiration) {
  const parts = expiration.split("/");
  if (parts.length !== 2) return expiration;
  const month = parts[0].trim();
  let year = parts[1].trim();
  if (year.length === 2) {
    year = "20" + year;
  }
  return `${year}-${month}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  
  const { amount, currency, checkoutData } = req.body;
  
  // Monta o corpo da requisição para criar o pedido
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
  
  // Se os dados do cartão estiverem presentes, adiciona o payment_source
  if (checkoutData && checkoutData.cardDetails) {
    const card = checkoutData.cardDetails;
    requestBody.payment_source = {
      card: {
        name: `${checkoutData.firstName} ${checkoutData.lastName}`,
        number: card.number,
        expiry: convertExpiration(card.expiration),
        security_code: card.csc,
        billing_address: {
          address_line_1: checkoutData.address,
          admin_area_2: checkoutData.city,
          admin_area_1: checkoutData.state,
          postal_code: checkoutData.cep,
          country_code: "BR"
        }
      }
    };
  }
  
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody(requestBody);
  
  try {
    const response = await paypalClient().execute(request);
    res.status(200).json(response.result);
  } catch (err) {
    console.error("Erro ao criar pedido no PayPal:", err);
    res.status(500).json({ error: err.toString() });
  }
}
