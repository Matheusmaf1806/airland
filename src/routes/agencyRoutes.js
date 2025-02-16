// src/routes/agencyRoutes.js
const express = require('express');
const router = express.Router();

const agencyController = require('../controllers/agencyController');

// Cadastro de agência (sign up)
router.post('/register', agencyController.register);

// Listar todas (em tese, só admin)
router.get('/', agencyController.listAll);

// Aprovar agência (somente admin)
router.put('/:id/approve', agencyController.approve);

// Rejeitar agência (somente admin)
router.put('/:id/reject', agencyController.reject);

module.exports = router;
