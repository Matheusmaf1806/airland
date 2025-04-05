// routes/orderInit.js
import express from 'express'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { cart, user } = req.body 
    // Exemplo: cart = m[], user = t{}

    // 1) Preparar alguns valores:
    // data_venda => data atual, em formato "YYYY-MM-DD"
    const now = new Date()
    const data_venda_str = now.toISOString().slice(0,10) // "2025-04-05"

    // destino => se "m" tiver .destino ou .city ou algo assim. Se não, "desconhecido".
    // item => se tiver 1 item, use cart[0].nomeItem. Se tiver vários, junte nomes.
    let destino = "Não definido"
    let item = "Sem item"
    let data_utilizacao_str = data_venda_str // se quiser a mesma data, ou a 1ª do carrinho

    if (cart && cart.length > 0) {
      // Exemplo: se cart[0] tiver .city
      destino = cart[0].city || "Não definido"
      item    = cart.map(it => it.categoria || "Item").join(" + ") 
      // data_utilizacao => a 1ª data de uso do carrinho
      // Se cart[0].dataUso existe, formate:
      if (cart[0].dataUso) {
        data_utilizacao_str = cart[0].dataUso.slice(0,10) 
      }
    }

    // nome => "Nome Sobrenome" do passageiro principal
    let nomeCompleto = "Usuário Desconhecido"
    if (user.firstName && user.lastName) {
      nomeCompleto = `${user.firstName} ${user.lastName}`
    }

    // data_nascimento => do t.birthdate, formate "YYYY-MM-DD" se vier em outro formato
    let data_nascimento_str = data_venda_str
    if (user.birthdate) {
      const bd = new Date(user.birthdate)
      data_nascimento_str = bd.toISOString().slice(0,10)
    }

    // UF => do DDD do telefone? A princípio, se user.state for "SP" etc., use user.state
    // Se quiser extrair do DDD, teria que parsear user.celular
    let uf = user.state || "SP"

    // affiliate_id => se for 101 no site business.airland.com.br
    // ou se for pego da URL (req.headers.host?), etc.:
    const affiliate_id = 101

    // agente_id => se vier no carrinho, ex cart.ownerId ou algo similar:
    let agente_id = 0
    if (cart && cart.length>0 && cart[0].agenteId) {
      agente_id = cart[0].agenteId
    }

    // Efetivado_por => idem, se no cart tiver o id de quem gerou
    let efetivadoPor = "System"
    if (cart && cart.length>0 && cart[0].geradoPor) {
      efetivadoPor = cart[0].geradoPor
    }

    // data_pgto => "data_venda + 1 dia"? (Você comentou isso, mas normalmente só setamos data_pgto ao pagar)
    // Porém, se quer mesmo fixo, faça:
    const data_pgto_date = new Date(now.getTime() + 24*60*60*1000) // +1 dia
    const data_pgto_str = data_pgto_date.toISOString().slice(0,10)

    const { data, error } = await supabase
      .from('supplier_pedidos')
      .insert({
        // CAMPOS:
        data_venda: data_venda_str,
        destino,
        item,
        data_utilizacao: data_utilizacao_str,
        status: 'pending', // "pending" antes do pagamento
        nome: nomeCompleto,
        data_nascimento: data_nascimento_str,
        uf,
        nome_comprador: "", // Normalmente definimos no paymentSuccess quando sabemos o nome do cartão
        meio_pgto: "pending",  
        bandeira_cartao: null,
        parcelas: 0,
        valor_venda: 0, // Se quiser zero aqui, e depois no paymentSuccess a gente faz update
        origem_cliente: "0", // ou "FrontSite"
        cliente_de: "",
        efetivado_por: efetivadoPor,
        observacoes_operacionais: null,
        observacoes_financeiras: null,
        gateway: null,
        data_pgto: data_pgto_str,  // se quer +1 dia
        email: user.email || "",
        telefone: user.celular || "",
        cpf: (user.cpf || "").replace(/\D/g, ""),
        affiliate_id,
        agente_id,
        pedido: cart ? JSON.stringify(cart) : "[]",
        passageiros: user.extraPassengers 
          ? JSON.stringify(user.extraPassengers) 
          : null
      })
      .select()

    if (error) {
      throw new Error(error.message)
    }
    if (!data || data.length === 0) {
      return res.json({ success: false, message: 'Nenhum registro inserido' })
    }

    const insertedId = data[0].id
    return res.json({ success: true, orderId: insertedId })

  } catch (err) {
    console.error('Erro em /api/orderInit:', err)
    return res.json({ success: false, message: err.message })
  }
})

export default router
