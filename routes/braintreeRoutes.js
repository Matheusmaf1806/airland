// routes/braintreeRoutes.js
const express = require('express');
const router = express.Router();
const { gateway } = require('../braintree');

router.get('/get-client-token', async (req, res) => {
  try {
    const response = await gateway.clientToken.generate({});
    res.json({ clientToken: response.clientToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar client token' });
  }
});

module.exports = router;
