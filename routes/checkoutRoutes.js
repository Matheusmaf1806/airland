// routes/checkoutRoutes.js

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

// Se quiser pegar variáveis de ambiente:
require('dotenv').config();

const router = express.Router();

// Instancia o Supabase usando as variáveis de ambiente
// (Na Vercel, elas ficam em Project Settings -> Environment Variables)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cuidado: a service_role_key é confidencial, então
// não colocar isso no front-end; somente no backend
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rota que irá receber o POST do front-end 
router.post('/checkoutComplete', async (req, res) => {
  try {
    // O body deve conter todos os campos que você quer inserir
    const {
      data_venda,
      destino,
      item,
      data_utilizacao,
      status,
      nome,
      data_nascimento,
      uf,
      nome_comprador,
      meio_pgto,
      bandeira_cartao,
      parcelas,
      valor_venda,
      origem_cliente,
      cliente_de,
      efetivado_por,
      observacoes_operacionais,
      observacoes_financeiras,
      gateway,
      data_pgto,
      email,
      telefone,
      cpf,
      affiliate_id,
      agente_id,
      pedido,
      passageiros
    } = req.body;

    // Faz a inserção no Supabase
    const { data, error } = await supabase
      .from('supplier_pedidos')
      .insert([{
        data_venda,
        destino,
        item,
        data_utilizacao,
        status,
        nome,
        data_nascimento,
        uf,
        nome_comprador,
        meio_pgto,
        bandeira_cartao,
        parcelas,
        valor_venda,
        origem_cliente,
        cliente_de,
        efetivado_por,
        observacoes_operacionais,
        observacoes_financeiras,
        gateway,
        data_pgto,
        email,
        telefone,
        cpf,
        affiliate_id,
        agente_id,
        pedido,
        passageiros
      }]);

    if (error) {
      console.error('Erro ao inserir pedido no Supabase:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao inserir pedido',
        error: error.message
      });
    }

    // Se deu certo, retornamos status 200 com dados inseridos
    return res.status(200).json({
      success: true,
      message: 'Pedido inserido com sucesso!',
      insertedData: data
    });

  } catch (err) {
    console.error('Exceção ao inserir pedido:', err);
    return res.status(500).json({
      success: false,
      message: 'Exceção ao inserir pedido',
      error: err.message
    });
  }
});

module.exports = router;
