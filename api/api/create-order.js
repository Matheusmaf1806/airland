// api/create-order.js
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { paypalClient } from './paypalClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: "USD", // Dólares
        value: "100.00"       // Valor do pagamento
      }
    }],
    application_context: {
      // URLs para redirecionamento após aprovação ou cancelamento
      return_url: "https://seu-dominio.com/return", // Atualize para a URL do seu front-end
      cancel_url: "https://seu-dominio.com/cancel"
    }
  });
  
  try {
    const response = await paypalClient().execute(request);
    // Retorne toda a resposta para extrair o link de aprovação no front-end
    res.status(200).json(response.result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.toString() });
  }
}
