const crypto = require('crypto');
const axios = require('axios');
const { API_KEY, SECRET } = require('../config');

async function fetchHotelsFromHotelbeds({ checkIn, checkOut, adults, children, rooms, age }) {
  try {
    // 1) Montar o timestamp
    const timestamp = Math.floor(Date.now() / 1000); // em segundos
    // 2) String to hash = apiKey + secret + timestamp
    const stringToHash = API_KEY + SECRET + timestamp;
    // 3) Gerar o SHA-256
    const signatureHex = crypto
      .createHash('sha256')
      .update(stringToHash)
      .digest('hex');
    // 4) Montar headers
    const headers = {
      'Api-Key': API_KEY,
      'X-Signature': signatureHex,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // 5) Montar o body conforme seu snippet
    // Aqui, iremos supor que você queira mandar no body algo do tipo:
    const requestBody = {
      stay: {
        checkIn: checkIn,   // "2025-03-21"
        checkOut: checkOut, // "2025-03-22"
        allowOnlyShift: true
      },
      occupancies: [
        {
          adults: parseInt(adults, 10),
          children: parseInt(children, 10),
          rooms: parseInt(rooms, 10),
          paxes: [
            {
              type: 'AD', // Hardcoded
              age: parseInt(age || 30, 10)
            }
          ]
        }
      ],
      // Exemplo fixo de hoteis
      hotels: {
        hotel: [234673, 897496, 89413, 13204, 52174, 989016],
        included: 'true',
        type: 'HOTELBEDS'
      },
      platform: 80,
      language: 'ENG'
    };

    // 6) Fazer a requisição a Hotelbeds (URL fictícia ou real)
    //    Ajuste a URL exata do endpoint do seu integrador.
    const url = 'https://api.test.hotelbeds.com/hotel-api/1.0/hotels'; // EXEMPLO, troque pela real

    const response = await axios.post(url, requestBody, { headers });

    // 7) Retornar a "lista" de hotéis.  
    // O shape exato depende do que a Hotelbeds retorna. 
    // Vamos supor que retorne algo tipo: { hotels: [ { id, name, price, currency }, ... ] }
    // e chamaremos .data para extrair.
    return response.data; 
  } catch (error) {
    console.error('Erro ao buscar na Hotelbeds:', error.message);
    throw error;
  }
}

module.exports = {
  fetchHotelsFromHotelbeds
};
