import express from 'express';
import { createOrder, captureOrder } from '../paypalIntegration.js'; // Importa as funções do PayPal

const router = express.Router();

// Rota para criar um pedido no PayPal
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency } = req.body; // Recebe os dados do pedido do front-end
    const orderData = await createOrder(amount, currency); // Chama a função para criar o pedido
    res.status(200).json(orderData); // Retorna os dados do pedido, incluindo o ID
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Erro ao criar pedido no PayPal' });
  }
});

// Rota para capturar o pagamento do pedido no PayPal
router.post('/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body; // ID do pedido recebido do front-end
    const captureData = await captureOrder(orderId); // Chama a função para capturar o pagamento
    res.status(200).json(captureData); // Retorna os dados da captura do pagamento
  } catch (err) {
    console.error('Erro ao capturar pedido:', err);
    res.status(500).json({ error: 'Erro ao capturar pagamento no PayPal' });
  }
});

export default router;
