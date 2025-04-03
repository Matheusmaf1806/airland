// routes/malga.js
import express from 'express'
import axios from 'axios'

// Exemplo: use dotenv ou algo similar no seu server.js/app.js para carregar .env
// import dotenv from 'dotenv'
// dotenv.config()

export const malgaRouter = express.Router()

/**
 * Exemplo de rota POST: /malga/pay
 * Recebe tokenId e amount do front e chama a API da Malga
 */
malgaRouter.post('/pay', async (req, res) => {
  try {
    const { tokenId, amount } = req.body

    // Pegamos as variáveis de ambiente
    const apiUrl = process.env.MALGA_API_URL      // por ex, "https://api.malga.io/payments"
    const apiKey = process.env.MALGA_API_KEY      // ex: "bfabc953-1ea0-45d0-95e4-4968cfe2a00e"
    const clientId = process.env.MALGA_CLIENT_ID  // ex: "4457c178-0f07-4589-ba0e-954e5816fd0f"

    if (!apiUrl || !apiKey || !clientId) {
      return res.status(500).json({
        success: false,
        error: 'Variáveis de ambiente MALGA_API_URL, MALGA_API_KEY ou MALGA_CLIENT_ID não configuradas',
      })
    }

    // Exemplo de payload: pode variar conforme a doc da Malga
    const payload = {
      amount,
      tokenId,
      clientId, 
      // Outros parâmetros específicos que a Malga possa exigir (moeda, etc.)
    }

    // Exemplo: header com x-api-key
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    }

    // Fazendo a requisição à API da Malga
    const response = await axios.post(apiUrl, payload, { headers })

    // Supondo que a Malga retorne algo como { success: true, ... }, podemos repassar
    return res.json({
      success: true,
      message: `Cobrança de ${amount} realizada com sucesso.`,
      malgaResponse: response.data,
    })
  } catch (error) {
    console.error('Erro ao processar pagamento na rota /pay:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * Rota GET para teste: /malga/test
 */
malgaRouter.get('/test', (req, res) => {
  return res.json({ message: 'Rota /test da malgaRouter está ok!' })
})
