const express = require('express');
const path = require('path');
const { PORT } = require('./config');
const hotelsRoute = require('./routes/hotelsRoute');

const app = express();

// Se precisar ler body JSON pra outras rotas:
app.use(express.json());

// Rota de "hotels"
app.use('/hotels', hotelsRoute);

// Servir pasta de arquivos estáticos (onde estará o front "index.html")
app.use(express.static(path.join(__dirname, 'public')));

// Se quiser uma rota default:
app.get('/', (req, res) => {
  // Redirecionar pro front-end se quiser
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
