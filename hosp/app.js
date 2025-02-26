// hosp/app.js
const express = require('express');
const path = require('path');
const hotelsRoute = require('./routes/hotelsRoute');

const app = express();

// Se for receber JSON no corpo:
app.use(express.json());

// Se for usar "public" com HTML estático:
app.use(express.static(path.join(__dirname, 'public')));

// Monta prefixo "/hosp/hotels" => se quiser /hosp/hotels no front
// Exemplo: app.use('/hosp/hotels', hotelsRoute);
app.use('/hosp/hotels', hotelsRoute);

// Rota simples p/ ver se subiu
app.get('/hosp/test', (req, res) => {
  res.send('Rota /hosp/test ok!');
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
