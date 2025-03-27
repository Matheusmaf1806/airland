// api/create-order.js
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { paypalClient } from './paypalClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  
  // Recebe os dados do pedido enviados pelo front-end
  const { amount, currency, checkoutData } = req.body;
  const cardDetails = checkoutData.cardDetails;
  const payerName = `${checkoutData.firstName} ${checkoutData.lastName}`;
  
  // Monta o payload com a fonte de pagamento usando os dados do cartão
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    payment_source: {
      card: {
        type: cardDetails.type,               // "CREDIT" ou "DEBIT"
        number: cardDetails.number,
        expiry: cardDetails.expiration,         // Deve estar no formato "AAAA-MM"
        security_code: cardDetails.csc,
        name: payerName,
        billing_address: {
          address_line_1: checkoutData.address,
          admin_area_2: checkoutData.city,
          admin_area_1: checkoutData.state,
          postal_code: checkoutData.cep,
          country_code: "BR"
        }
      }
    },
    purchase_units: [{
      amount: {
        currency_code: currency || "BRL",
        value: amount || "100.00"
      }
    }]
  });
  
  try {
    const response = await paypalClient().execute(request);
    // Retorna o resultado para o front-end (incluindo o id do pedido)
    res.status(200).json(response.result);
  } catch (err) {
    console.error("Erro na criação do pedido:", err);
    res.status(500).json({ error: err.toString() });
  }
}
