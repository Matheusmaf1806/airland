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
  return `${year}-${month.padStart(2, '0')}`;
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
  
  // Cria o pedido
  const createRequest = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  createRequest.prefer("return=representation");
  createRequest.requestBody(requestBody);
  
  try {
    const createResponse = await paypalClient().execute(createRequest);
    const order = createResponse.result;
    
    // Se os dados do cartão estiverem presentes, anexa o payment_source via PATCH
    if (checkoutData && checkoutData.cardDetails) {
      const card = checkoutData.cardDetails;
      const patchRequest = new checkoutNodeJssdk.orders.OrdersPatchRequest(order.id);
      patchRequest.requestBody([
        {
          op: "add",
          path: "/payment_source",
          value: {
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
          }
        }
      ]);
      await paypalClient().execute(patchRequest);
    }
    
    res.status(200).json(order);
  } catch (err) {
    console.error("Erro ao criar/atualizar pedido no PayPal:", err);
    res.status(500).json({ error: err.toString() });
  }
}
