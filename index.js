// index.js
require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.APP_PORT || 3000;

const { sequelize } = require('./src/config/database');

// Rotas existentes
const affiliateRoutes = require('./src/routes/affiliateRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

// >>> NOVO: rotas de autenticação/registro <<<
const authRoutes = require('./src/routes/authRoutes');

// Middleware
app.use(express.json());

// Uso das rotas
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/orders', orderRoutes);

// >>> Novo uso de rotas
app.use('/api/auth', authRoutes);

sequelize.sync({ alter: true })
  .then(() => {
    console.log('Banco de dados sincronizado com sucesso.');
  })
  .catch((error) => {
    console.error('Erro ao sincronizar banco de dados:', error);
  });

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
