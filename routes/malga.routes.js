// routes/malga.routes.js
import express from 'express';
import { tokenization } from '@malga/tokenization';

const router = express.Router();

// Inicializa o SDK da Malga utilizando as credenciais sensíveis (disponíveis somente no back-end)
const malgaTokenization = tokenization({
  apiKey: process.env.MALGA_API_KEY,      // Chave secreta
  clientId: process.env.MALGA_CLIENT_ID,    // Client ID
  options: {
    sandbox: true, // Use false em produção
    // Outras configurações, se necessário
  }
});

// Endpoint para criar a transação de pagamento
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
      // Para cartão, suponha que o token do cartão já foi criado no front-end.
      // Aqui, você pode chamar o fluxo 3DS (se necessário) e criar a transação.
      const tokenWith3DS = await malgaTokenization.verify3DS(paymentToken, amount);
      // Após a verificação, crie a transação. Esse exemplo simula uma transação.
      transaction = {
        success: true,
        transactionId: `card_${tokenWith3DS}_transaction`
      };
    } else if (paymentMethod === 'pix') {
      // Para Pix, gera os dados do pagamento via Pix
      const pixData = await malgaTokenization.generatePixPayment({ amount });
      transaction = {
        success: true,
        transactionId: `pix_${pixData.code}_transaction`,
        pixCode: pixData.code  // Código Pix para exibição no front-end
      };
    } else if (paymentMethod === 'boleto') {
      // Para boleto, gera os dados do boleto
      const boletoData = await malgaTokenization.generateBoletoPayment({ amount });
      transaction = {
        success: true,
        transactionId: `boleto_${boletoData.url}_transaction`,
        boletoUrl: boletoData.url  // URL para exibição/consulta do boleto
      };
    } else {
      return res.status(400).json({ success: false, message: 'Método de pagamento inválido' });
    }

    return res.json(transaction);
  } catch (error) {
    console.error("Erro ao criar a transação:", error);
    return res.status(500).json({ success: false, message: "Erro interno no servidor" });
  }
});

export default router;
