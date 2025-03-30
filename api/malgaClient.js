// api/malgaClient.js
const axios = require('axios');
require('dotenv').config();

const MALGA_API_URL = process.env.MALGA_API_URL;
const CLIENT_ID = process.env.MALGA_CLIENT_ID;
const API_KEY = process.env.MALGA_API_KEY;

const instance = axios.create({
  baseURL: MALGA_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Id': CLIENT_ID,
    'X-Api-Key': API_KEY,
  },
});

async function createCharge(payload) {
  try {
    const response = await instance.post('/charges', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating charge:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = { createCharge };
