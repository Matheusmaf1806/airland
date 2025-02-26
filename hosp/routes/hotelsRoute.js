// routes/hotelsRoute.js
const express = require('express')
const router = express.Router()
const { getHotels } = require('../controllers/hotelsController')

// POST /hotels
router.post('/', getHotels)

module.exports = router
