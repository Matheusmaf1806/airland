// api/worker.js
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Cria o cliente do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const BOOKING_URL = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels";
const CONTENT_URL = "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels";

// Função para gerar a assinatura
function generateSignature(apiKey, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  return crypto
    .createHash("sha256")
    .update(apiKey + secretKey + timestamp)
    .digest("hex");
}

// Função para criar delay (em ms)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
  try {
    // 1. Obter credenciais
    const apiKey = process.env.API_KEY_HH;
    const apiSec = process.env.SECRET_KEY_HH;
    if (!apiKey || !apiSec) {
      return res.status(500).json({ error: "Credenciais ausentes." });
    }
    
    // 2. Gerar assinatura
    const signature = generateSignature(apiKey, apiSec);
    
    // 3. Definir parâmetros padrão (pode ser parametrizado se desejar)
    const checkIn = "2025-06-15";
    const checkOut = "2025-06-16";
    const destination = "MCO";
    const roomsCount = 1;
    
    // 4. Montar o array de occupancies
    const occupancies = [];
    for (let i = 1; i <= roomsCount; i++) {
      occupancies.push({ rooms: 1, adults: 2, children: 0 });
    }
    
    // 5. Configurar corpo da requisição para a Booking API
    const bodyData = {
      stay: { checkIn, checkOut },
      occupancies,
      destination: { code: destination }
    };
    
    // 6. Chamada à Booking API (POST)
    const bookingResp = await fetch(`${BOOKING_URL}?limit=20`, {
      method: "POST",
      headers: {
        "Api-key": apiKey,
        "X-Signature": signature,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(bodyData)
    });
    const bookingJson = await bookingResp.json();
    if (!bookingResp.ok) {
      return res.status(bookingResp.status).json({
        error: bookingJson.error || "Erro na API Booking",
        details: bookingJson
      });
    }
    
    // 7. Extrair array de hotéis
    const hotelsArray = bookingJson?.hotels?.hotels || [];
    if (!hotelsArray.length) {
      return res.json({ availability: bookingJson, combined: [] });
    }
    
    // 8. Para cada hotel, buscar os detalhes na Content API e salvar no Supabase
    const combined = [];
    for (const hotel of hotelsArray) {
      try {
        const contentResp = await fetch(
          `${CONTENT_URL}?codes=${hotel.code}&language=ENG&fields=all`,
          {
            method: "GET",
            headers: {
              "Api-Key": apiKey,
              "X-Signature": signature,
              "Accept": "application/json"
            }
          }
        );
        let contentData = {};
        if (contentResp.ok) {
          const contentJson = await contentResp.json();
          // Assume que o retorno é um array e buscamos o item com o código correto
          contentData = contentJson?.hotels ? contentJson.hotels.find(ch => ch.code === hotel.code) || {} : {};
        } else {
          console.warn(`Erro na Content API para hotel ${hotel.code}`);
        }
        
        // 9. Montar objeto do hotel para o banco
        const hotelObj = {
          code: hotel.code,
          name: hotel.name,
          categoryCode: hotel.categoryCode,
          categoryName: hotel.categoryName,
          minRate: hotel.minRate,
          maxRate: hotel.maxRate,
          currency: hotel.currency,
          rooms: hotel.rooms,
          // Dados de conteúdo extraídos
          content: {
            name: contentData.name ? contentData.name.content : hotel.name,
            description: contentData.description ? contentData.description.content : "",
            facilities: contentData.facilities || [],
            images: (contentData.images || []).map(img => `https://photos.hotelbeds.com/giata/xl/${img.path}`),
            interestPoints: contentData.interestPoints || []
          }
        };
        
        // 10. Upsert no Supabase (tabela "hotels_content")
        const { error } = await supabase
          .from("hotels_content")
          .upsert({
            hotel_code: hotelObj.code,
            name: hotelObj.name,
            description: hotelObj.content.description,
            category_code: hotelObj.categoryCode,
            category_name: hotelObj.categoryName,
            currency: hotelObj.currency,
            content_json: hotelObj.content,
            last_updated: new Date().toISOString()
          }, { onConflict: "hotel_code" });
          
        if (error) {
          console.error(`Erro ao salvar hotel ${hotelObj.code}:`, error);
        } else {
          console.log("Hotel salvo:", hotelObj.code);
        }
        
        combined.push(hotelObj);
      } catch (innerError) {
        console.error("Erro ao processar hotel", hotel.code, innerError);
        combined.push({ ...hotel, content: null });
      }
      
      // Delay para evitar saturar a Content API
      await sleep(250);
    }
    
    // 11. Retorna resultado (para log, mesmo que a função seja agendada)
    res.json({
      availability: bookingJson,
      combined
    });
    
  } catch (err) {
    console.error("Worker error:", err);
    res.status(500).json({ error: "Erro interno", message: err.message });
  }
}
