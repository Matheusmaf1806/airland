// routes/tickets.js
const express = require('express');
const router = express.Router();
const { getPool } = require('../db');

// Rota para listar ingressos
router.get('/', async (req, res) => {
  try {
    // Recebe o affiliateId via query string (ex.: ?affiliateId=123)
    const affiliateId = req.query.affiliateId || 0;

    const pool = getPool();
    const sql = `
      SELECT 
        b.product_pk,
        b.name_site,
        b.id_site,
        b.id_dsd,
        b.price AS base_price,
        s.margin AS supplier_margin,
        a.margin AS affiliate_margin
      FROM bd_net AS b
      LEFT JOIN supplier_categories_margin AS s
        ON b.id_site = s.id_site AND b.id_dsd = s.id_dsd
      LEFT JOIN affiliate_categories_margin AS a
        ON b.id_site = a.id_site AND b.id_dsd = a.id_dsd AND a.affiliate_id = ?
      WHERE b.forDate >= CURDATE()  -- Exemplo de filtro para produtos a partir de hoje
      ORDER BY b.forDate ASC
      LIMIT 50
    `;
    
    const [rows] = await pool.query(sql, [affiliateId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao buscar ingressos' });
  }
});

// Rota para obter um ingresso específico
router.get('/:productPk', async (req, res) => {
  try {
    const { productPk } = req.params;
    const affiliateId = req.query.affiliateId || 0;
    const pool = getPool();
    
    const sql = `
      SELECT 
        b.product_pk,
        b.name_site,
        b.id_site,
        b.id_dsd,
        b.price AS base_price,
        s.margin AS supplier_margin,
        a.margin AS affiliate_margin
      FROM bd_net AS b
      LEFT JOIN supplier_categories_margin AS s
        ON b.id_site = s.id_site AND b.id_dsd = s.id_dsd
      LEFT JOIN affiliate_categories_margin AS a
        ON b.id_site = a.id_site AND b.id_dsd = a.id_dsd AND a.affiliate_id = ?
      WHERE b.product_pk = ?
      LIMIT 1
    `;
    
    const [rows] = await pool.query(sql, [affiliateId, productPk]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao buscar ingresso' });
  }
});

module.exports = router;
