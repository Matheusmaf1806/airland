// routes/orderInit.js
import express from 'express'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carregar variáveis do .env (caso este arquivo rode sozinho, igual ao server.js)
dotenv.config()

// Inicializa cliente do Supabase (se preferir, importe de outro local)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const router = express.Router()

// POST /api/orderInit
router.post('/', async (req, res) => {
  try {
    // cart e user vêm do body do front-end
    const { cart, user } = req.body

    // Exemplo: inserimos um novo registro na tabela "orders"
    // com status "pending" e retornamos o ID gerado.
    const { data, error } = await supabase
      .from('orders')
      .insert({
        status: 'pending',
        created_at: new Date().toISOString(),
        cart: JSON.stringify(cart), // se quiser armazenar o carrinho como JSON
        user_name: user?.name || null,
        user_email: user?.email || null,
        user_phone: user?.phone || null
      })
      // .select() retorna as linhas inseridas (inclusive o ID)
      .select()

    if (error) {
      throw new Error(error.message)
    }
    if (!data || data.length === 0) {
      return res.json({ success: false, message: 'Erro ao criar pedido' })
    }

    // Supondo que sua coluna de PK se chama "id"
    const insertedId = data[0].id

    // Retorna o ID real do pedido para o front
    return res.json({ success: true, orderId: insertedId })
  } catch (err) {
    console.error('Erro em /api/orderInit:', err)
    return res.json({ success: false, message: err.message })
  }
})

export default router
