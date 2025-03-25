// api/capture-order.js
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { paypalClient } from './paypalClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  
  const { orderId } = req.body;
  if (!orderId) {
    res.status(400).json({ error: 'orderId é obrigatório' });
    return;
  }
  
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});
  
  try {
    const response = await paypalClient().execute(request);
    res.status(200).json(response.result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.toString() });
  }
}
