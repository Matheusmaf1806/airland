import dotenv from 'dotenv';
dotenv.config();  // Carrega as variáveis de ambiente do arquivo .env
import fetch from 'node-fetch';  // Importa o fetch para fazer a requisição
import CryptoJS from 'crypto-js'; // Para a criptografia SHA-256

// Pega as credenciais das variáveis de ambiente
const publicKey = process.env.API_KEY_HH;  // Sua API Key
const privateKey = process.env.SECRET_KEY_HH; // Sua Secret Key

// Função para gerar a assinatura X-Signature
export function generateSignature() {
  const utcDate = Math.floor(new Date().getTime() / 1000); // Timestamp UTC (em segundos)
  const assemble = `${publicKey}${privateKey}${utcDate}`;  // Combina os dados necessários para gerar a assinatura
  
  // Criptografia SHA-256 da combinação
  const hash = CryptoJS.SHA256(assemble).toString(CryptoJS.enc.Hex);
  return hash;
}

// Função para fazer a requisição para a API do Hotelbeds
export async function getHotelData(destination, limit = 5, offset = 1) {
  const signature = generateSignature();  // Gera a assinatura necessária para a requisição

  // URL da API Hotelbeds com os parâmetros necessários
  const url = `https://api.test.hotelbeds.com/activity-cache-api/1.0/portfolio?destination=${destination}&limit=${limit}&offset=${offset}`;

  // Realizando a requisição à API com os cabeçalhos necessários
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Api-key': publicKey,         // A chave pública da API
      'X-Signature': signature,     // A assinatura gerada
    },
  });

  // Caso a resposta seja bem-sucedida, converte o resultado para JSON
  const data = await response.json();

  // Verifica se houve algum erro na resposta
  if (data.error) {
    throw new Error(data.error);
  }

  return data;  // Retorna os dados da resposta
}
