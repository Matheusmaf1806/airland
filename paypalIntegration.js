import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Função para criar um pedido no PayPal
export const createOrder = async (amount, currency = 'BRL') => {
  const url = 'https://api-m.sandbox.paypal.com/v2/checkout/orders'; // URL da API no Sandbox
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.PAYPAL_ACCESS_TOKEN}`, // Usar o token de acesso
  };

  const body = JSON.stringify({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount,
        },
      },
    ],
    application_context: {
      return_url: process.env.RETURN_URL,
      cancel_url: process.env.CANCEL_URL,
      // Adicionando o campo user_action para permitir ao PayPal exibir opções de pagamento
      user_action: 'PAY_NOW',  // Esta configuração pode ajudar a exibir a opção de parcelamento
    },
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      throw new Error('Erro ao criar o pedido no PayPal');
    }

    const data = await response.json();
    return data; // Retorna os dados com o ID do pedido
  } catch (err) {
    console.error('Erro ao criar pedido no PayPal:', err);
    throw err;
  }
};

// Função para capturar o pagamento após a aprovação do comprador
export const captureOrder = async (orderId) => {
  const url = `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.PAYPAL_ACCESS_TOKEN}`,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error('Erro ao capturar o pagamento no PayPal');
    }

    const data = await response.json();
    return data; // Retorna os dados da captura
  } catch (err) {
    console.error('Erro ao capturar pedido no PayPal:', err);
    throw err;
  }
};
