import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function getAccessToken() {
  const url = 'https://api-m.sandbox.paypal.com/v1/oauth2/token';
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${Buffer.from(process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_CLIENT_SECRET).toString('base64')}`,
  };

  const body = 'grant_type=client_credentials';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      throw new Error('Erro ao gerar o Access Token');
    }

    const data = await response.json();
    console.log('Access Token:', data.access_token);
    return data.access_token; // Retorna o Access Token
  } catch (err) {
    console.error('Erro ao obter Access Token:', err);
  }
}

getAccessToken();
