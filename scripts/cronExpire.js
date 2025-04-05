/**
 * scripts/cronExpire.js
 *
 * Script que expira pedidos "pending" após 48h.
 * Rode este script periodicamente (ex.: 1x ao dia).
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

// Cria client do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // Se precisar de permissão total, use SERVICE_ROLE_KEY
)

async function expireOldPending() {
  try {
    // Data/hora atual
    const now = new Date()
    // Exemplo: 48 horas atrás
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    // Formato ISO sem milissegundos
    const isoStr = twoDaysAgo.toISOString().slice(0, 19).replace('T',' ')

    console.log("Expirando pendentes criados antes de:", isoStr)

    // Atualizamos supplier_pedidos:
    // status = 'expired' onde status='pending' e created_at < isoStr
    const { data, error } = await supabase
      .from('supplier_pedidos')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('created_at', isoStr)  // se created_at for do tipo timestamp
      .select()

    if (error) {
      console.error("Erro ao expirar pendentes:", error)
    } else {
      console.log("Pedidos expirados (atualizados):", data)
    }

  } catch (err) {
    console.error("Exceção no cronExpire script:", err)
  }
}

// Executa a função principal
expireOldPending()
