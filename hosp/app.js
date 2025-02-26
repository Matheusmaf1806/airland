// app.js
const express = require('express')
const bodyParser = require('body-parser')
const hotelsRoute = require('./routes/hotelsRoute')

const app = express()
app.use(bodyParser.json())

app.use('/hotels', hotelsRoute)

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000')
})
