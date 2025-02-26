// services/hotelbedsService.js
const axios = require('axios')
const crypto = require('crypto')
const { API_KEY, SECRET } = require('../config') // ou algo do tipo

function generateSignature(apiKey, secret) {
  const timestamp = Math.floor(Date.now() / 1000)
  const stringToHash = apiKey + secret + timestamp
  const signatureHex = crypto
    .createHash('sha256')
    .update(stringToHash)
    .digest('hex')
  return signatureHex
}

async function searchHotels({ checkIn, checkOut, adults, children, rooms }) {
  // 1) geramos a X-Signature
  const xSignature = generateSignature(API_KEY, SECRET)

  // 2) Montar payload no formato Hotelbeds (Exemplo simplificado)
  const payload = {
    stay: {
      checkIn,
      checkOut,
      allowOnlyShift: true
    },
    occupancies: [
      {
        adults,
        children,
        rooms,
        paxes: [
          { type: 'AD', age: 30 } // etc. Ajuste conforme sua necessidade
        ]
      }
    ],
    hotels: {
      hotel: [234673, 897496], // ou dinâmico
      included: 'true',
      type: 'HOTELBEDS'
    },
    platform: 80,
    language: 'ENG'
  }

  try {
    // 3) Chamar a API
    const response = await axios.post(
      'https://api.test.hotelbeds.com/hotel-api/1.0/hotels',
      payload,
      {
        headers: {
          'Api-Key': API_KEY,
          'X-Signature': xSignature,
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'Content-Type': 'application/json'
        }
      }
    )
    // 4) Retorna o JSON
    return response.data
  } catch (error) {
    console.error('Erro na busca Hotelbeds:', error.message)
    throw error // repasse o erro ou trate
  }
}

module.exports = {
  searchHotels
}
