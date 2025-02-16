// src/controllers/agencyController.js
const Agency = require('../models/Agency');
const bcrypt = require('bcrypt');

module.exports = {
  // ===========================
  // CADASTRAR (SIGN UP)
  // ===========================
  async register(req, res) {
    try {
      // Recebe dados do body
      const { name, email, password } = req.body;

      // Verifica se já existe email igual
      const existing = await Agency.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'E-mail já cadastrado.' });
      }

      // Cria a agência com status 'pending'
      const newAgency = await Agency.create({ name, email, password, status: 'pending' });

      // Retorna sem a senha
      const { password: _, ...agencyNoPass } = newAgency.toJSON();
      return res.status(201).json(agencyNoPass);

    } catch (error) {
      console.error('Erro ao cadastrar agência:', error);
      return res.status(500).json({ error: 'Erro interno ao cadastrar agência.' });
    }
  },

  // ===========================
  // LISTAR TODAS (ADMIN)
  // ===========================
  async listAll(req, res) {
    try {
      // Poderia filtrar por status? Ex.: { where: { status: 'pending' } }
      const agencies = await Agency.findAll();
      return res.json(agencies);
    } catch (error) {
      console.error('Erro ao listar agências:', error);
      return res.status(500).json({ error: 'Erro interno ao listar agências.' });
    }
  },

  // ===========================
  // APROVAR (ADMIN)
  // ===========================
  async approve(req, res) {
    try {
      const { id } = req.params;
      const agency = await Agency.findByPk(id);

      if (!agency) {
        return res.status(404).json({ error: 'Agência não encontrada.' });
      }

      agency.status = 'approved';
      await agency.save();
      return res.json({ message: 'Agência aprovada com sucesso.' });

    } catch (error) {
      console.error('Erro ao aprovar agência:', error);
      return res.status(500).json({ error: 'Erro interno ao aprovar agência.' });
    }
  },

  // ===========================
  // REJEITAR (opcional)
  // ===========================
  async reject(req, res) {
    try {
      const { id } = req.params;
      const agency = await Agency.findByPk(id);

      if (!agency) {
        return res.status(404).json({ error: 'Agência não encontrada.' });
      }

      agency.status = 'rejected';
      await agency.save();
      return res.json({ message: 'Agência rejeitada com sucesso.' });

    } catch (error) {
      console.error('Erro ao rejeitar agência:', error);
      return res.status(500).json({ error: 'Erro interno ao rejeitar agência.' });
    }
  }
};
