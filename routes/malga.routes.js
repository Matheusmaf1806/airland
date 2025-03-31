// routes/malga.routes.js
import express from 'express';
import malgaTokenization from '@malga/tokenization'; // Import DEFAULT (ajuste principal)

// Cria o roteador do Express
const router = express.Router();

// Inicializa o SDK da Malga utilizando as credenciais sensíveis (disponíveis somente no back-end)
const malga = malgaTokenization({
  apiKey: process.env.MALGA_API_KEY,    // Chave secreta
  clientId: process.env.MALGA_CLIENT_ID, // Client ID
  options: {
    sandbox: true, // Use false em produção
    // Outras configurações, se necessário
  }
});

/**
 * POST /api/malga/create-transaction
 * Cria a transação de pagamento conforme o método de pagamento (cartão, pix, boleto).
 */
router.post('/create-transaction', async (req, res) => {
  try {
    // Extrai os dados do corpo da requisição
    const {
      paymentMethod,    // "card", "pix" ou "boleto"
      paymentToken,     // Token do cartão (para pagamento com cartão)
      amount,
      installments,
      customer,
      billing,
      extraPassengers,
      insuranceSelected
    } = req.body;

    let transaction;

    if (paymentMethod === 'card') {
      // Para cartão de crédito:
      // Se necessário, chamar verificação 3DS:
      const tokenWith3DS = await malga.verify3DS(paymentToken, amount);

      // Dependendo do fluxo, pode ser necessário criar a transação com outro método do SDK
      // para registrar a cobrança de fato. Neste exemplo, apenas simulamos a resposta.
      transaction = {
        success: true,
        transactionId: `card_${tokenWith3DS}_transaction`,
      };

    } else if (paymentMethod === 'pix') {
      // Para Pix, gera os dados de pagamento via Pix:
      const pixData = await malga.generatePixPayment({ amount });
      // Retorna código Pix para exibição no front-end
      transaction = {
        success: true,
        transactionId: `pix_${pixData.code}_transaction`,
        pixCode: pixData.code
      };

    } else if (paymentMethod === 'boleto') {
      // Para boleto, gera os dados do boleto:
      const boletoData = await malga.generateBoletoPayment({ amount });
      // Retorna URL do boleto para exibição
      transaction = {
        success: true,
        transactionId: `boleto_${boletoData.url}_transaction`,
        boletoUrl: boletoData.url
      };

    } else {
      // Se o método de pagamento não for reconhecido, retorne 400 (bad request)
      return res.status(400).json({ success: false, message: 'Método de pagamento inválido' });
    }

    // Retorna os dados da transação para o front-end
    return res.json(transaction);

  } catch (error) {
    console.error("Erro ao criar a transação:", error);
    return res.status(500).json({ success: false, message: "Erro interno no servidor" });
  }
});

export default router;
