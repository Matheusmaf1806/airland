// src/routes/affiliateRoutes.js
const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliateController');

// Rotas
router.get('/', affiliateController.list);
router.post('/', affiliateController.create);
router.get('/:id', affiliateController.getById);
router.put('/:id', affiliateController.update);
router.delete('/:id', affiliateController.remove);

module.exports = router;
