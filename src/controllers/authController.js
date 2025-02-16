// src/controllers/authController.js
const Agency = require('../models/Agency');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Localiza agência pelo email
      const agency = await Agency.findOne({ where: { email } });
      if (!agency) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      // Verifica status
      if (agency.status !== 'approved') {
        return res.status(403).json({ error: 'Agência não aprovada ou pendente.' });
      }

      // Confere senha
      const match = await bcrypt.compare(password, agency.password);
      if (!match) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      // Gera JWT
      const token = jwt.sign(
        { agencyId: agency.id, email: agency.email },
        process.env.JWT_SECRET || 'segredo-trocar-em-producao',
        { expiresIn: '1d' }
      );

      return res.json({ token, message: 'Login bem-sucedido!' });
    } catch (error) {
      console.error('Erro ao logar:', error);
      return res.status(500).json({ error: 'Erro interno ao fazer login.' });
    }
  }
};
