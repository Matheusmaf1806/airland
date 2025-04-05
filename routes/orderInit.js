// routes/orderInit.js
import express from 'express'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carregar variáveis do .env
dotenv.config()

// Inicializa cliente do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // Se precisar de permissões mais amplas, use a Service Role Key
)

const router = express.Router()

// POST /api/orderInit
router.post('/', async (req, res) => {
  try {
    // cart e user vêm do body do front-end
    const { cart, user } = req.body

    // Ajuste conforme seus campos no `user` (por ex. user.cpf, user.email, etc.)
    const userName   = user?.name        || "Usuário Desconhecido"
    const userEmail  = user?.email       || "sememail@exemplo.com"
    const userPhone  = user?.phone       || "(00)0000-0000"
    const userCpf    = user?.cpf         || "00000000000"

    // Exemplo: criamos registro em supplier_pedidos com status "pending"
    // e valores mínimos em todas as colunas NOT NULL da sua tabela.
    const { data, error } = await supabase
      .from('supplier_pedidos')
      .insert({
        // Campos do "supplier_pedidos"
        data_venda: new Date().toISOString(),  // date not null
        destino: "Indefinido",                 // not null
        item: "Carrinho inicial",              // not null
        data_utilizacao: new Date().toISOString(), // not null
        status: "pending",                     // ok
        nome: userName,                        // not null
        data_nascimento: new Date().toISOString(), // not null
        uf: "SP",                              // char(2) not null
        nome_comprador: userName,              // not null
        meio_pgto: "pending",                  // not null
        bandeira_cartao: null,                 // pode ser null
        parcelas: 0,                           // default 0
        valor_venda: 0.00,                     // not null
        origem_cliente: "FrontSite",           // not null (ajuste se quiser)
        cliente_de: "Integração",              // not null
        efetivado_por: "System",               // not null
        observacoes_operacionais: null,        // text null
        observacoes_financeiras: null,         // text null
        gateway: null,                         // pode ser null
        data_pgto: new Date().toISOString(),   // date not null
        email: userEmail,                      // not null
        telefone: userPhone,                   // null é permitido mas você pode pôr ""
        cpf: userCpf,                          // char(11) not null
        affiliate_id: 0,                       // not null
        agente_id: 0,                          // not null
        // Campos JSON
        pedido: cart ? JSON.stringify(cart) : null,
        passageiros: null
      })
      .select()

    if (error) {
      throw new Error(error.message)
    }
    if (!data || data.length === 0) {
      return res.json({ success: false, message: 'Erro ao criar pedido (data vazio)' })
    }

    // PK da tabela
    const insertedId = data[0].id

    // Retorna o ID real do pedido
    return res.json({ success: true, orderId: insertedId })
  } catch (err) {
    console.error('Erro em /api/orderInit:', err)
    return res.json({ success: false, message: err.message })
  }
})

export default router
