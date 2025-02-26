// hosp/services/hotelbedsService.js
const axios = require('axios');
const crypto = require('crypto');
const { API_KEY, SECRET, HOTELBEDS_BASE_URL } = require('../config');

async function getHotelsFromHotelbeds(payload) {
  // 1) Gera timestamp
  const timestamp = Math.floor(Date.now() / 1000);

  // 2) String p/ hash
  const stringToHash = API_KEY + SECRET + timestamp;
  
  // 3) Cria hash SHA256 em hexa
  const signatureHex = crypto
    .createHash('sha256')
    .update(stringToHash)
    .digest('hex');

  // Monta cabeçalhos conforme doc do Hotelbeds
  const headers = {
    'Api-key': API_KEY,
    'X-Signature': signatureHex,
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip',
    'Content-Type': 'application/json'
  };

  try {
    // POST p/ endpoint do hotelbeds
    const response = await axios.post(
      `${HOTELBEDS_BASE_URL}/hotels`,
      payload,
      { headers }
    );

    return response.data; // Retorna JSON
  } catch (err) {
    console.error('Erro no getHotelsFromHotelbeds:', err?.response?.data || err.message);
    throw err;
  }
}

module.exports = { getHotelsFromHotelbeds };
