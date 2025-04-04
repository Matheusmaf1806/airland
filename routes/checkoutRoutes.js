// checkoutRoutes.js (EM ESM)
import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

// Exemplo de criação do client com a Service Role Key
// (Não exponha no front, só no back!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

router.post('/checkoutComplete', async (req, res) => {
  try {
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
    } = req.body

    // Insere no Supabase
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
      }])

    if (error) {
      console.error('Erro ao inserir pedido no Supabase:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao inserir pedido',
        error: error.message
      })
    }

    // Sucesso:
    return res.status(200).json({
      success: true,
      message: 'Pedido inserido com sucesso!',
      insertedData: data
    })

  } catch (err) {
    console.error('Exceção ao inserir pedido:', err)
    return res.status(500).json({
      success: false,
      message: 'Exceção ao inserir pedido',
      error: err.message
    })
  }
})

// Aqui, faça o export default
export default router
