// hosp/app.js
const express = require('express');
const path = require('path');
require('dotenv').config(); // se quiser ler variáveis do .env

const app = express();
app.use(express.json());

// Importar rota
const hotelsRoute = require('./routes/hotelsRoute');

// Montar a rota em /hosp/hotels
app.use('/hosp/hotels', hotelsRoute);

// Se quiser servir um HTML estático, por ex.:
app.use(express.static(path.join(__dirname, 'public')));

// Subir o servidor local na porta 3000 (exemplo)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
