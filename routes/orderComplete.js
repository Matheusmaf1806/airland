// orderComplete.js
import express from 'express'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carregar variáveis do .env (caso este arquivo rode isolado, assim como server.js)
dotenv.config()

// Criar cliente do Supabase (caso não queira duplicar código, você pode
// exportar o 'supabase' de outro arquivo e importar aqui.)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const router = express.Router()

// Rota POST /api/orderComplete
router.post('/', async (req, res) => {
  try {
    // Lemos o ID do pedido e o objeto de atualização
    const { orderId, dataToUpdate } = req.body

    if (!orderId) {
      return res.json({
        success: false,
        message: 'É necessário fornecer um orderId'
      })
    }

    // Faz o UPDATE na tabela "orders" (ajuste conforme seu schema)
    const { data, error } = await supabase
      .from('orders')
      .update(dataToUpdate)    // ex: { status: 'pago', meio_pgto: 'credit', ... }
      .eq('id', orderId)       // filtra pelo ID

    if (error) {
      throw new Error(error.message)
    }

    // Retornamos os registros atualizados (caso queira ver no front)
    return res.json({
      success: true,
      updatedData: data
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
