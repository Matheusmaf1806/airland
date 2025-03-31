///////////////////////////////////////////////////////////
// routes/malga.routes.js
// Integração real (sandbox) com Malga Tokenization v2 no Back-end
///////////////////////////////////////////////////////////

import { Router } from 'express';
import { MalgaTokenization } from '@malga/tokenization';

export const malgaRouter = Router();

/**
 * ROTA: POST /api/malga/tokenize-card
 * Gera o token do cartão chamando a Malga (sandbox)
 */
malgaRouter.post('/tokenize-card', async (req, res) => {
  try {
    // Extrair os dados do cartão enviados pelo front-end
    const {
      cardNumber,
      cardHolderName,
      cardExpirationDate,
      cardCvv
    } = req.body;

    // Inicializar o MalgaTokenization com as chaves de ambiente
    const malgaTokenization = new MalgaTokenization({
      apiKey: process.env.MALGA_API_KEY,      // Definida na Vercel como MALGA_API_KEY
      clientId: process.env.MALGA_CLIENT_ID,    // Definida na Vercel como MALGA_CLIENT_ID
      options: {
        config: {
          sandbox: true, // Sandbox para testes; altere para false em produção
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

    // Chamar o método tokenize passando os dados do cartão
    const { tokenId, error } = await malgaTokenization.tokenize({
      cardNumber,
      cardHolderName,
      cardExpirationDate,
      cardCvv
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao tokenizar cartão',
        rawError: error
      });
    }

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
 * ROTA: POST /api/malga/verify-3ds
 * Executa o fluxo 3DS com Malga (caso a doc v2 permita)
 */
malgaRouter.post('/verify-3ds', async (req, res) => {
  try {
    // Espera que o front envie { tokenId, amount }
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

    // Chama o método verify3DS – confirme na documentação se este método existe
    const token3DS = await malgaTokenization.verify3DS(tokenId, amount);

    return res.json({
      success: true,
      token3DS: token3DS
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
 * ROTA: POST /api/malga/create-transaction
 * Finaliza a transação (pagamento) utilizando o token (possivelmente pós-3DS)
 */
malgaRouter.post('/create-transaction', async (req, res) => {
  try {
    // Espera que o front envie { tokenId, amount, installments, ... }
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

    // Chama o método createTransaction (confirme na documentação o nome e os parâmetros)
    const transactionResult = await malgaTokenization.createTransaction({
      tokenId,
      amount,
      installments
      // Adicione outros parâmetros necessários conforme a doc real
    });

    if (transactionResult.error) {
      return res.status(400).json({
        success: false,
        message: transactionResult.error.message
      });
    }

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
