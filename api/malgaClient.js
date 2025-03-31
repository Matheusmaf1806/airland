// api/malgaClient.js (ESM)
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const MALGA_API_URL = process.env.MALGA_API_URL || "https://sandbox.malga.com.br/api";
const CLIENT_ID = process.env.MALGA_CLIENT_ID;
const API_KEY = process.env.MALGA_API_KEY;

if (!MALGA_API_URL || !CLIENT_ID || !API_KEY) {
  console.error("Configuração da API Malga ausente. Verifique seu arquivo .env.");
  process.exit(1);
}

const instance = axios.create({
  baseURL: MALGA_API_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Client-Id": CLIENT_ID,
    "X-Api-Key": API_KEY,
  },
});

// Interceptor para log de requisições (útil para debug)
instance.interceptors.request.use(request => {
  console.log(`Malga API Request: ${request.method.toUpperCase()} ${request.url}`);
  console.log("Payload:", request.data);
  return request;
});

// Interceptor para log de respostas
instance.interceptors.response.use(
  response => {
    console.log("Malga API Response:", response.data);
    return response;
  },
  error => {
    console.error(
      "Malga API Error Response:",
      error.response ? error.response.data : error.message
    );
    return Promise.reject(error);
  }
);

/**
 * Cria uma cobrança na Malga com base no payload fornecido.
 * O payload deve incluir os dados necessários, como paymentMethod e demais informações do cliente.
 *
 * @param {object} payload - Dados da cobrança a serem enviados à API Malga.
 * @returns {object} - Dados da resposta da API Malga.
 */
export async function createCharge(payload) {
  try {
    const response = await instance.post("/charges", payload);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating charge:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}
