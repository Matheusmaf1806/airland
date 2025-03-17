const express = require('express');
const router = express.Router();
// Importa o controller
const { getHotels } = require('../api/hotelsController');

// Define rota GET /api/hoteis
router.get('/', getHotels);

module.exports = router;
