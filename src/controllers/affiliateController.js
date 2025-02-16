// src/controllers/affiliateController.js
const Affiliate = require('../models/Affiliate');

module.exports = {
  // Lista todos os afiliados
  async list(req, res) {
    try {
      const affiliates = await Affiliate.findAll();
      return res.json(affiliates);
    } catch (error) {
      console.error('Erro ao listar afiliados:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Cria um novo afiliado
  async create(req, res) {
    try {
      const { slug, name, logo_url, primary_color, secondary_color } = req.body;

      const newAffiliate = await Affiliate.create({
        slug,
        name,
        logo_url,
        primary_color,
        secondary_color
      });

      return res.status(201).json(newAffiliate);
    } catch (error) {
      console.error('Erro ao criar afiliado:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Obtém detalhes de um afiliado por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const affiliate = await Affiliate.findByPk(id);

      if (!affiliate) {
        return res.status(404).json({ error: 'Afiliado não encontrado' });
      }

      return res.json(affiliate);
    } catch (error) {
      console.error('Erro ao obter afiliado:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Atualiza um afiliado
  async update(req, res) {
    try {
      const { id } = req.params;
      const { slug, name, logo_url, primary_color, secondary_color } = req.body;

      const affiliate = await Affiliate.findByPk(id);
      if (!affiliate) {
        return res.status(404).json({ error: 'Afiliado não encontrado' });
      }

      affiliate.slug = slug;
      affiliate.name = name;
      affiliate.logo_url = logo_url;
      affiliate.primary_color = primary_color;
      affiliate.secondary_color = secondary_color;
      await affiliate.save();

      return res.json(affiliate);
    } catch (error) {
      console.error('Erro ao atualizar afiliado:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Exclui um afiliado
  async remove(req, res) {
    try {
      const { id } = req.params;
      const affiliate = await Affiliate.findByPk(id);

      if (!affiliate) {
        return res.status(404).json({ error: 'Afiliado não encontrado' });
      }

      await affiliate.destroy();
      return res.json({ message: 'Afiliado removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover afiliado:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};
