// config/index.js
require('dotenv').config()

module.exports = {
  API_KEY: process.env.API_KEY,
  SECRET: process.env.API_SECRET,
  OPERATOR_MARGIN: parseFloat(process.env.OPERATOR_MARGIN || '0.10'), // exemplo: 10%
}
