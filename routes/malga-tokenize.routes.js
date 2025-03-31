// routes/malga-tokenize.routes.js
import express from 'express';
import { tokenization } from '@malga/tokenization';

const router = express.Router();

// Exemplo de rota: POST /api/malga/tokenize-card
router.post('/tokenize-card', async (req, res) => {
  try {
    // 1) Receber dados do cartão
    const { cardNumber, cardHolderName, cardExpirationDate, cardCvv } = req.body;

    // 2) Inicializar a Malga (chaves no .env ou Project Settings Vercel)
    const malgaTokenization = tokenization({
      apiKey: process.env.MALGA_API_KEY,    // pegue as chaves do seu .env
      clientId: process.env.MALGA_CLIENT_ID,
      options: {
        config: {
          sandbox: true, // Troque para false em produção
          fields: {
            // Caso precise configurar algo para essa tokenização
            cardNumber: {
              needMask: false,
              defaultValidation: true
            },
            // ...
          }
        }
      }
    });

    // 3) Chamamos a função tokenize, passando os dados
    const result = await malgaTokenization.tokenize({
      cardNumber,
      cardHolderName,
      cardExpirationDate,
      cardCvv
    });

    // 4) Devolvemos o token gerado
    return res.json({
      success: true,
      tokenId: result.tokenId, // De acordo com o que a Malga retorna
      rawResult: result        // caso queira ver tudo
    });

  } catch (error) {
    console.error('Erro ao tokenizar cartão via Malga:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao tokenizar cartão',
      error: error.toString()
    });
  }
});

export default router;
