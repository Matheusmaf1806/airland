// hosp/routes/hotelsRoute.js
const express = require('express');
const router = express.Router();
const { listHotels } = require('../controllers/hotelsController');

// Exemplo: se no front usará fetch POST
// router.post('/', listHotels);

// Ou se quiser GET com query string
router.get('/', listHotels);

module.exports = router;
