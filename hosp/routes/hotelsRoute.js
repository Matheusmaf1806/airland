const express = require('express');
const router = express.Router();
const { getHotels } = require('../controllers/hotelsController');

// Supondo que seja GET /hotels?checkIn=...&checkOut=...
router.get('/', getHotels);

module.exports = router;
