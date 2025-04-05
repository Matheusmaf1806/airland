const express = require('express')
const router = express.Router()
const { completeOrder } = require('../controllers/orderController')

// POST /api/orderComplete
router.post('/', completeOrder)

module.exports = router
