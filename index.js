// index.js
require('dotenv').config(); // carrega as variáveis do .env

const express = require('express');
const app = express();
const port = process.env.APP_PORT || 3000;

// Importa o arquivo de conexão do Sequelize
const { sequelize } = require('./src/config/database');

// Rotas
const affiliateRoutes = require('./src/routes/affiliateRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
// Você pode adicionar outras rotas conforme necessário

// Middleware para interpretar JSON
app.use(express.json());

// Rotas
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/orders', orderRoutes);

// Sincroniza o banco (em modo desenvolvimento)
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Banco de dados sincronizado com sucesso.');
  })
  .catch((error) => {
    console.error('Erro ao sincronizar banco de dados:', error);
  });

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
