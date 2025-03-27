// api/create-order.js
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { paypalClient } from './paypalClient.js';  // Certifique-se de que o arquivo paypalClient.js está configurado

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  
  // Recebe os dados do pedido do front-end (ex.: amount, currency, checkoutData)
  const { amount, currency } = req.body;

  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{
      amount: { 
        currency_code: currency || "BRL", 
        value: amount || "100.00" 
      }
    }],
    // Não utilizamos payment_source aqui; o fluxo de redirecionamento usará o link "approve" para que o comprador autorize
    application_context: {
      return_url: process.env.RETURN_URL || "https://business.airland.com.br/return",
      cancel_url: process.env.CANCEL_URL || "https://business.airland.com.br/cancel"
    }
  });
  
  try {
    const response = await paypalClient().execute(request);
    // Retorna o objeto de resposta, que contém os links (incluindo o 'approve')
    res.status(200).json(response.result);
  } catch (err) {
    console.error("Erro ao criar pedido no PayPal:", err);
    res.status(500).json({ error: err.toString() });
  }
}
