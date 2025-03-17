// jobs/contentUpdateProcessor.js
import fetch from "node-fetch";
import crypto from "crypto";
import { contentUpdateQueue } from "./contentUpdateQueue.js";
import { createClient } from "@supabase/supabase-js";

// Configura o Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// URLs da Hotelbeds (teste – em produção, altere para o endpoint adequado)
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Função para gerar assinatura
function generateSignature(apiKey, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  return crypto.createHash("sha256").update(apiKey + secretKey + timestamp).digest("hex");
}

// Processador da fila
contentUpdateQueue.process(async (job) => {
  const { hotelCode } = job.data;
  try {
    const apiKey = process.env.API_KEY_HH;
    const apiSec = process.env.SECRET_KEY_HH;
    const signature = generateSignature(apiKey, apiSec);

    // Monta URL para Content API (usando query com "codes" mesmo para 1 hotel)
    const url = `${CONTENT_URL}?codes=${hotelCode}&language=ENG&fields=all`;
    const headers = {
      "Api-Key": apiKey,
      "X-Signature": signature,
      "Accept": "application/json"
    };

    const response = await fetch(url, { method: "GET", headers });
    const contentData = await response.json();
    if (!response.ok) {
      console.warn(`Erro ao buscar content para hotel ${hotelCode}:`, contentData);
      return Promise.reject(new Error(`Content API Error: ${response.status}`));
    }

    // Supondo que contentData.hotels seja um array e queremos o primeiro item
    const hotelContent = contentData.hotels ? contentData.hotels[0] : null;

    // Atualiza ou insere o conteúdo no Supabase
    const { error } = await supabase
      .from("hotel_content")
      .upsert({
        hotel_code: hotelCode,
        content_data: hotelContent,
        last_updated: new Date().toISOString()
      }, { onConflict: "hotel_code", returning: "minimal" });

    if (error) {
      console.error(`Erro ao salvar content do hotel ${hotelCode}:`, error);
      return Promise.reject(error);
    }

    console.log(`Content do hotel ${hotelCode} atualizado no banco.`);
    return Promise.resolve();
  } catch (err) {
    console.error(`Erro no processador para hotel ${hotelCode}:`, err);
    return Promise.reject(err);
  }
});
