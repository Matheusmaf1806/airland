// api/createCharge.js
const { createCharge } = require('./malgaClient');

module.exports = async (req, res) => {
  // Aceita somente o método POST
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    // Extrai os dados enviados no corpo da requisição
    const { amount, currency, paymentMethod, customer } = req.body;
    
    // Verifica se os campos obrigatórios foram enviados
    if (!amount || !paymentMethod || !customer) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes: amount, paymentMethod ou customer' });
    }

    // Define o valor final da cobrança.
    // Se o método escolhido for PIX, aplica um desconto de 5% (valor * 0.95)
    let finalAmount = amount;
    if (paymentMethod.paymentType === 'pix') {
      finalAmount = Math.round(amount * 0.95);
    }

    /*
      Monta o payload para a criação da cobrança na Malga.
      Observações:
      - Para cartão de crédito, espera-se que o objeto paymentMethod contenha os dados do cartão (número, nome, validade, CVV e o objeto threeDSecure, se necessário);
      - Para PIX, o objeto paymentMethod pode conter parâmetros como expiresIn, além do ajuste do valor;
      - Para boleto, o payload será similar ao de cartão de crédito, sem desconto.
    */
    const payload = {
      merchantId: process.env.MALGA_MERCHANT_ID,
      amount: finalAmount,
      currency: currency || 'BRL',
      statementDescriptor: 'Compra Online',
      capture: true,
      paymentMethod: paymentMethod,
      paymentSource: {
        sourceType: 'customer',
        customer: customer
      }
    };

    // Chama a função que faz a requisição para a API da Malga
    const charge = await createCharge(payload);

    // Retorna a resposta com status 201 (criado)
    res.status(201).json(charge);
  } catch (error) {
    console.error('Erro ao criar cobrança:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: 'Erro ao criar cobrança',
      details: error.response ? error.response.data : error.message
    });
  }
};
