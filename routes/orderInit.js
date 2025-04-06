// routes/orderInit.js
import express from 'express'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carrega variáveis do .env
dotenv.config()

// Inicializa cliente do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    // Front-end envia no body: { cart, user }
    // onde cart = m[], user = t{}
    const { cart, user } = req.body

    // 1) data_venda: data atual em formato YYYY-MM-DD
    const now = new Date()
    const data_venda_str = now.toISOString().slice(0, 10) // ex.: "2025-04-06"

    // 2) Determina destino, item, data_utilizacao a partir do cart
    let destino = "Não definido"
    let item = "Sem item"
    let data_utilizacao_str = data_venda_str // se quiser a mesma data, ou alguma do carrinho

    if (cart && cart.length > 0) {
      // Exemplo: se o carrinho tiver .city
      destino = cart[0].city || "Não definido"

      // Se cada item tiver .categoria, ou .hotelName
      // Aqui é só exemplo: "Hotel + Ingresso + ..." etc.
      item = cart.map(it => it.categoria || it.hotelName || "Item").join(" + ")

      // data_utilizacao: se cart[0].dataUso existir
      if (cart[0].dataUso) {
        // Garante formato YYYY-MM-DD:
        const dUso = new Date(cart[0].dataUso)
        data_utilizacao_str = dUso.toISOString().slice(0, 10)
      }
    }

    // 3) Nome do passageiro principal
    let nomeCompleto = "Usuário Desconhecido"
    if (user?.firstName && user?.lastName) {
      nomeCompleto = `${user.firstName} ${user.lastName}`
    }

    // 4) Data de nascimento
    // se user.birthdate vier como "yyyy-mm-dd" no front, já está OK,
    // mas vamos converter para Date e extrair .toISOString() só pra padronizar
    let data_nascimento_str = data_venda_str // default
    if (user?.birthdate) {
      const bd = new Date(user.birthdate)
      data_nascimento_str = bd.toISOString().slice(0, 10)
    }

    // 5) UF
    // A princípio, se user?.state for "SP" etc., use isso
    let uf = user?.state || "SP"

    // 6) Affiliate_id: se for 101 no site business.airland.com.br
    const affiliate_id = 101

    // 7) agente_id e efetivado_por
    let agente_id = 0
    let efetivadoPor = "System"
    if (cart && cart.length > 0) {
      if (cart[0].agenteId) {
        agente_id = cart[0].agenteId
      }
      if (cart[0].geradoPor) {
        efetivadoPor = cart[0].geradoPor
      }
    }

    // 8) data_pgto => se quiser fixar como hoje+1
    const data_pgto_date = new Date(now.getTime() + 24*60*60*1000) // +1 dia
    const data_pgto_str = data_pgto_date.toISOString().slice(0, 10)

    // 9) Insere no Supabase
    const { data, error } = await supabase
      .from('supplier_pedidos')
      .insert({
        data_venda: data_venda_str,
        destino,
        item,
        data_utilizacao: data_utilizacao_str,
        status: 'pending', // ainda não pago
        nome: nomeCompleto,
        data_nascimento: data_nascimento_str,
        uf,
        nome_comprador: "",           // será definido no paymentSuccess
        meio_pgto: "pending",         // idem
        bandeira_cartao: null,
        parcelas: 0,
        valor_venda: 0,              // definimos no paymentSuccess
        origem_cliente: "0",
        cliente_de: "",
        efetivado_por: efetivadoPor,
        observacoes_operacionais: null,
        observacoes_financeiras: null,
        gateway: null,
        data_pgto: data_pgto_str,    // se quiser +1 dia fixo
        email: user?.email || "",
        telefone: user?.celular || "",
        cpf: (user?.cpf || "").replace(/\D/g, ""),
        affiliate_id,
        agente_id,
        // Salva o carrinho em JSON:
        pedido: cart ? JSON.stringify(cart) : "[]",
        // Salva os passageiros extras
        passageiros: user?.extraPassengers
          ? JSON.stringify(user.extraPassengers)
          : "[]"
      })
      .select()

    if (error) {
      throw new Error(error.message)
    }
    if (!data || data.length === 0) {
      return res.json({ success: false, message: 'Nenhum registro foi inserido' })
    }

    const insertedId = data[0].id
    return res.json({ success: true, orderId: insertedId })

  } catch (err) {
    console.error('Erro em /api/orderInit:', err)
    return res.json({ success: false, message: err.message })
  }
})

export default router
