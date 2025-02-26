// hosp/routes/hotelsRoute.js
const express = require('express');
const router = express.Router();
const hotelsController = require('../controllers/hotelsController');

// GET /hosp/hotels?checkIn=...&checkOut=...
router.get('/', hotelsController.getHotels);

module.exports = router;
