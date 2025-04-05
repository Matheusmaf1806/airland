// routes/orderComplete.js
import express from 'express'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carrega variáveis de ambiente do .env
dotenv.config()

// Inicia o cliente do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // Se precisar de permissões totais, use SERVICE_ROLE_KEY
)

const router = express.Router()

// Rota POST /api/orderComplete
router.post('/', async (req, res) => {
  try {
    const { orderId, dataToUpdate } = req.body
    if (!orderId) {
      return res.json({
        success: false,
        message: 'É necessário fornecer o campo orderId'
      })
    }

    // dataToUpdate deve conter as chaves que você deseja atualizar na tabela,
    // por ex.: { status: 'pago', valor_venda: 100.00, bandeira_cartao: 'visa', ... }

    // Faz o UPDATE na tabela supplier_pedidos
    const { data, error } = await supabase
      .from('supplier_pedidos')
      .update(dataToUpdate)   // por exemplo: {status: 'pago', meio_pgto: 'credit'}
      .eq('id', orderId)      // atualiza o registro cujo id = orderId
      .select()               // retorna as linhas atualizadas para conferência

    if (error) {
      throw new Error(error.message)
    }

    // Se quiser conferir se data retornou algo, poderia checar data.length
    return res.json({
      success: true,
      updatedData: data // envia de volta as linhas atualizadas (pode ser útil no front)
    })
  } catch (err) {
    console.error('Erro em /api/orderComplete:', err)
    return res.json({
      success: false,
      message: err.message
    })
  }
})

export default router
