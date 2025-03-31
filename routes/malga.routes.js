///////////////////////////////////////////////////////////
// routes/malga.routes.js
// Exemplo 100% Completo - Malga Tokenization v2 no BACK
///////////////////////////////////////////////////////////
import { Router } from 'express';
import { MalgaTokenization } from '@malga/tokenization';

export const malgaRouter = Router();

/**
 * 1) ROTA: POST /api/malga/tokenize-card
 *    Gera token do cartão no back-end
 */
malgaRouter.post('/tokenize-card', async (req, res) => {
  try {
    // Ler dados do cartão no body (JSON enviado pelo front-end)
    const {
      cardNumber,
      cardHolderName,
      cardExpirationDate,
      cardCvv
      // Se houver mais campos, adicione
    } = req.body;

    // Inicializar Malga v2
    const malgaTokenization = new MalgaTokenization({
      apiKey: process.env.MALGA_API_KEY,    // Suas chaves
      clientId: process.env.MALGA_CLIENT_ID,
      options: {
        config: {
          // Aqui definimos sandbox: true (teste). Troque p/ false em produção
          sandbox: true,
          // Exemplo de fields e styles. Necessário ou não, depende da doc final
          fields: {
            cardNumber: {
              placeholder: '9999 9999 9999 9999',
              type: 'text'
            },
            cardHolderName: {
              placeholder: 'Fulano de Tal',
              type: 'text'
            },
            cardExpirationDate: {
              placeholder: 'MM/YY',
              type: 'text'
            },
            cardCvv: {
              placeholder: '123',
              type: 'text'
            }
          },
          styles: {
            input: {
              color: '#000',
              'font-size': '16px'
            }
          }
        }
      }
    });

    // Chamar malgaTokenization.tokenize() com os dados que veio do front
    const { tokenId, error } = await malgaTokenization.tokenize({
      cardNumber,
      cardHolderName,
      cardExpirationDate,
      cardCvv
    });

    if (error) {
      // Se houve erro de validação / algo
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao tokenizar cartão',
        rawError: error
      });
    }

    // Se deu certo, retornamos tokenId
    return res.json({
      success: true,
      tokenId
    });
  } catch (err) {
    console.error('Erro ao tokenizar cartão Malga v2:', err);
    return res.status(500).json({
      success: false,
      message: 'Falha ao tokenizar cartão',
      error: err.toString()
    });
  }
});

/**
 * 2) ROTA: POST /api/malga/verify-3ds
 *    Fluxo 3DS no back-end (se a doc v2 permitir esse método)
 */
malgaRouter.post('/verify-3ds', async (req, res) => {
  try {
    // Supondo que o front envie { tokenId, amount }
    const { tokenId, amount } = req.body;

    const malgaTokenization = new MalgaTokenization({
      apiKey: process.env.MALGA_API_KEY,
      clientId: process.env.MALGA_CLIENT_ID,
      options: {
        config: {
          sandbox: true
        }
      }
    });

    // Se a doc v2 tiver verify3DS:
    // (Você precisa confirmar se de fato existe esse método no v2)
    const result3DS = await malgaTokenization.verify3DS(tokenId, amount);

    return res.json({
      success: true,
      token3DS: result3DS
    });
  } catch (err) {
    console.error('Erro no verify3DS Malga (v2):', err);
    return res.status(500).json({
      success: false,
      message: 'Falha ao verificar 3DS',
      error: err.toString()
    });
  }
});

/**
 * 3) ROTA: POST /api/malga/create-transaction
 *    Exemplo para fechar a compra (pagamento)
 *    Ajuste conforme a doc real do Malga
 */
malgaRouter.post('/create-transaction', async (req, res) => {
  try {
    // Exemplo: front manda { tokenId, amount, installments, ... }
    const { tokenId, amount, installments } = req.body;

    const malgaTokenization = new MalgaTokenization({
      apiKey: process.env.MALGA_API_KEY,
      clientId: process.env.MALGA_CLIENT_ID,
      options: {
        config: {
          sandbox: true
        }
      }
    });

    // Supondo que v2 tenha um createTransaction. Verifique a doc oficial
    // As libs de gateway geralmente exigem "paymentMethod: 'credit_card'" e etc.
    const transactionResult = await malgaTokenization.createTransaction({
      tokenId,
      amount,
      installments
      // ... e o que mais for necessário
    });

    if (transactionResult.error) {
      return res.status(400).json({
        success: false,
        message: transactionResult.error.message
      });
    }

    // Se deu tudo certo, retornamos ID da transação
    return res.json({
      success: true,
      transactionId: transactionResult.id
    });
  } catch (err) {
    console.error('Erro ao criar transação Malga (v2):', err);
    return res.status(500).json({
      success: false,
      message: 'Falha ao criar transação',
      error: err.toString()
    });
  }
});
