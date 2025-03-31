// routes/malga.routes.js
import express from 'express';
import { tokenization } from '@malga/tokenization';

const router = express.Router();

// Inicializa o SDK da Malga com as credenciais secretas (somente disponíveis no back-end)
const malgaTokenization = tokenization({
  apiKey: process.env.MALGA_API_KEY,      // Variável de ambiente com a chave secreta
  clientId: process.env.MALGA_CLIENT_ID,    // Variável de ambiente com o client ID
  options: {
    sandbox: true, // Utilize false em produção
    // Outras configurações podem ser adicionadas conforme a documentação do SDK
  }
});

// Rota para criar a transação de pagamento
router.post('/create-transaction', async (req, res) => {
  try {
    // Extrai os dados enviados no corpo da requisição
    const {
      paymentToken,
      amount,
      installments,
      customer,
      billing,
      extraPassengers,
      insuranceSelected,
      paymentMethod
    } = req.body;

    // Aqui você integraria com a API da Malga para criar a transação
    // Por exemplo:
    // const transaction = await malgaTokenization.createTransaction({
    //   paymentToken,
    //   amount,
    //   installments,
    //   customer,
    //   billing,
    //   extraPassengers,
    //   insuranceSelected,
    //   paymentMethod
    // });
    
    // Neste exemplo, simulamos uma resposta de sucesso
    const transaction = {
      success: true,
      transactionId: "simulated_transaction_id_12345"
    };

    res.json(transaction);
  } catch (error) {
    console.error("Erro ao criar a transação:", error);
    res.status(500).json({ success: false, message: "Erro interno no servidor" });
  }
});

export default router;
