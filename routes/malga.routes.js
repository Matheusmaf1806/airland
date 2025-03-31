// routes/malga.routes.js
import express from 'express';
// Se a Malga tiver um SDK oficial de pagamentos para Node, importe-o aqui.
// Exemplo fictício: import * as MalgaPayments from '@malga/payment-node';
// Se não existir SDK, você pode usar fetch/axios para chamar a API HTTP da Malga.

const router = express.Router();

/**
 * POST /api/malga/create-transaction
 * Recebe token e dados do front-end e cria a transação no back-end.
 * É aqui que suas credenciais privadas ficam protegidas no servidor.
 */
router.post('/create-transaction', async (req, res) => {
  try {
    // Extrai dados do corpo da requisição enviados pelo front-end
    const {
      paymentMethod,    // 'card', 'pix' ou 'boleto'
      paymentToken,     // token gerado no front (via Malga Tokenization)
      amount,           // ex.: '123.45' (ou '12345' se em centavos)
      installments,
      customer,         // { firstName, lastName, email, phone }
      billing,          // { streetAddress, extendedAddress, locality, region, postalCode, ... }
      extraPassengers,
      insuranceSelected
    } = req.body;

    // Simulamos um objeto "transaction" para retorno.
    // Em um cenário real, você chamaria a API/SDK para criar a transação de fato.
    let transaction;

    // Se fosse um SDK, você faria algo como:
    //   const transaction = await MalgaPayments.authorizeCard({
    //     token: paymentToken,
    //     amount: parseFloat(amount),
    //     installments,
    //     customer,
    //     billing,
    //     // etc...
    //   });
    // ou chamaria a API HTTP.

    if (paymentMethod === 'card') {
      // Supondo que já tenha verificado 3DS no front ou queira chamar algo adicional aqui
      // Exemplo fictício:
      transaction = {
        success: true,
        transactionId: `card_${paymentToken}_transaction`,
        message: 'Transação de cartão criada com sucesso!'
      };

    } else if (paymentMethod === 'pix') {
      // Em um fluxo real, você chamaria algo como:
      //   const pixResponse = await MalgaPayments.generatePix({ amount, ... });
      //   transaction = { success: true, transactionId: pixResponse.id, ...pixResponse };
      transaction = {
        success: true,
        transactionId: `pix_txn_${new Date().getTime()}`,
        pixCode: 'ABCD12345PIX',
        message: 'Transação de PIX gerada com sucesso!'
      };

    } else if (paymentMethod === 'boleto') {
      // Em um fluxo real, algo como:
      //   const boletoResponse = await MalgaPayments.generateBoleto({ amount, ... });
      //   transaction = { success: true, transactionId: boletoResponse.id, boletoUrl: boletoResponse.url };
      transaction = {
        success: true,
        transactionId: `boleto_txn_${new Date().getTime()}`,
        boletoUrl: 'https://example.com/boleto/xyz',
        message: 'Transação de boleto gerada com sucesso!'
      };

    } else {
      // Se o método não foi reconhecido, retorna 400 (Bad Request)
      return res.status(400).json({
        success: false,
        message: 'Método de pagamento inválido.'
      });
    }

    // Retorna a transação simulada (ou a real) para o front-end
    return res.json(transaction);

  } catch (error) {
    console.error('Erro ao criar a transação:', error);
    // Retorna 500 se houve erro interno
    return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
});

export default router;
