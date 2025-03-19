const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const CryptoJS = require('crypto-js');

// Exemplo de rota GET para obter o conteúdo do hotel
router.get('/hotel-content', async (req, res) => {
  const hotelCode = req.query.hotelCode;
  if (!hotelCode) {
    return res.status(400).json({ error: 'Hotel code é obrigatório' });
  }

  const API_KEY = process.env.API_KEY; // Definido na Vercel ou em variáveis de ambiente
  const SECRET = process.env.SECRET;

  // Geração do timestamp em UTC (segundos)
  const utcDate = Math.floor(Date.now() / 1000);
  const assemble = API_KEY + SECRET + utcDate;
  const encryption = CryptoJS.SHA256(assemble).toString(CryptoJS.enc.Hex);

  try {
    const response = await fetch(`https://api.test.hotelbeds.com/hotel-api/1.0/hotels?hotelCode=${hotelCode}`, {
      method: 'GET',
      headers: {
        "Api-key": API_KEY,
        "X-Signature": encryption,
        "Accept": "application/json",
        "Accept-Encoding": "gzip"
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar conteúdo do hotel:", error);
    res.status(500).json({ error: 'Erro ao buscar conteúdo do hotel' });
  }
});

// Exemplo de rota POST para buscar os preços
router.post('/hotels', async (req, res) => {
  const { stay, occupancies, hotels } = req.body;
  if (!stay || !occupancies || !hotels) {
    return res.status(400).json({ error: 'Payload inválido' });
  }

  const API_KEY = process.env.API_KEY;
  const SECRET = process.env.SECRET;

  const utcDate = Math.floor(Date.now() / 1000);
  const assemble = API_KEY + SECRET + utcDate;
  const encryption = CryptoJS.SHA256(assemble).toString(CryptoJS.enc.Hex);

  try {
    const response = await fetch("https://api.test.hotelbeds.com/hotel-api/1.0/hotels", {
      method: 'POST',
      headers: {
        "Api-key": API_KEY,
        "X-Signature": encryption,
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ stay, occupancies, hotels })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar preços:", error);
    res.status(500).json({ error: 'Erro ao buscar preços' });
  }
});

module.exports = router;
