const express = require('express');
const router = express.Router();
const axios = require('axios');
const { paypal } = require('../config');

// Reutilize a função para obter access token (pode ser extraída para um módulo reutilizável)
async function getAccessToken() {
  const auth = Buffer.from(`${paypal.clientId}:${paypal.secret}`).toString('base64');
  const response = await axios.post(`${paypal.baseUrl}/v1/oauth2/token`, 'grant_type=client_credentials', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`
    }
  });
  return response.data.access_token;
}

// Rota para capturar o pedido
router.post('/', async (req, res) => {
  try {
    const { orderID } = req.body;  // O ID do pedido deve ser enviado no corpo da requisição
    const accessToken = await getAccessToken();

    const response = await axios.post(`${paypal.baseUrl}/v2/checkout/orders/${orderID}/capture`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao capturar pedido:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Erro ao capturar pedido' });
  }
});

module.exports = router;
