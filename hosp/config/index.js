// hosp/config/index.js
const dotenv = require('dotenv');
dotenv.config(); // Carrega as variáveis do .env

module.exports = {
  API_KEY: process.env.API_KEY,
  SECRET: process.env.SECRET,
  OPERATOR_MARGIN: parseFloat(process.env.OPERATOR_MARGIN || '0.10'),
  HOTELBEDS_BASE_URL: process.env.HOTELBEDS_BASE_URL || 'https://api.test.hotelbeds.com/hotel-api/1.0',
  // etc
};
