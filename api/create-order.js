// api/create-order.js
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { paypalClient } from './paypalClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  
  const { amount, currency, checkoutData } = req.body;
  
  // Se houver dados do cartão, prepare o objeto payment_source
  let payment_source;
  if (checkoutData && checkoutData.cardDetails) {
    const card = checkoutData.cardDetails;
    // Supõe que o usuário digita no formato "MM/YY". Converte para "YYYY-MM"
    const [month, year] = card.expiration.split("/");
    const expiry = `20${year}-${month.padStart(2, '0')}`;
    
    payment_source = {
      card: {
        number: card.number,
        expiry: expiry,
        security_code: card.csc,
        name: `${checkoutData.firstName || ""} ${checkoutData.lastName || ""}`.trim(),
        billing_address: {
          address_line_1: checkoutData.address || "",
          address_line_2: checkoutData.number || "",
          admin_area_2: checkoutData.city || "",
          admin_area_1: checkoutData.state || "",
          postal_code: checkoutData.cep || "",
          country_code: "BR"
        }
      }
    };
  }
  
  // Cria o payload para a criação do pedido
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  
  const bodyPayload = {
    intent: "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: currency || "BRL",
        value: amount || "100.00"
      }
    }],
    application_context: {
      return_url: process.env.RETURN_URL || "https://business.airland.com.br/return",
      cancel_url: process.env.CANCEL_URL || "https://business.airland.com.br/cancel"
    }
  };
  
  // Se payment_source foi definido, inclua-o no payload
  if (payment_source) {
    bodyPayload.payment_source = payment_source;
  }
  
  request.requestBody(bodyPayload);
  
  try {
    const response = await paypalClient().execute(request);
    // Retorna a resposta do PayPal
    res.status(200).json(response.result);
  } catch (err) {
    console.error("Erro ao criar pedido no PayPal:", err);
    res.status(500).json({ error: err.toString() });
  }
}
