require('dotenv').config();

module.exports = {
  API_KEY: process.env.API_KEY,
  SECRET: process.env.SECRET,
  // Exemplo: 10% de margem para a operadora
  OPERATOR_MARGIN: parseFloat(process.env.OPERATOR_MARGIN || '0.10'),
  // Exemplo: 5% de margem para a agência
  AGENCY_MARGIN: parseFloat(process.env.AGENCY_MARGIN || '0.05'),
  PORT: parseInt(process.env.PORT || '3000', 10)
};
