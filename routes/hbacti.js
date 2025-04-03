//////////////////////////////////////////////////////////////
// hbacti.js - Exemplo ESM (Node, Express, Supabase, dayjs)
//
// 1) Filtra para destination = "MCO" e 1 adulto
// 2) Env vars: API_KEY_HA, SECRET_KEY_HA
// 3) Pausa de 2s após cada chunk
//////////////////////////////////////////////////////////////

import { Router } from "express";
import dayjs from "dayjs";
import fetch from "node-fetch";
import crypto from "crypto";

// Importe (ou crie) seu supabase client aqui
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const router = Router();

// ---------------------------------------------------
// 1) Gerar assinatura (Hotelbeds Activities) 
//    usando API_KEY_HA e SECRET_KEY_HA
function generateSignature() {
  const publicKey = process.env.API_KEY_HA;      // ex.: "123456"
  const privateKey = process.env.SECRET_KEY_HA;  // ex.: "xyzabc..."
  const utcDate = Math.floor(Date.now() / 1000);
  const assemble = publicKey + privateKey + utcDate;
  return crypto.createHash("sha256").update(assemble).digest("hex");
}

// ---------------------------------------------------
// 2) Chamar a API de Activities e retornar JSON (destino = "MCO", 1 adulto)
async function callActivityAPI(fromDateStr, toDateStr) {
  // Montar headers
  const signature = generateSignature();
  const url = "https://api.test.hotelbeds.com/activity-api/3.0/activities/availability";

  const myHeaders = {
    "Api-key": process.env.API_KEY_HA,
    "X-Signature": signature,
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  // Montar body
  // Filtro para "MCO", 1 pax adulto
  const body = {
    filters: [
      {
        searchFilterItems: [
          {
            type: "destination",
            value: "MCO"  // fixo MCO
          }
        ]
      }
    ],
    paxes: [
      { age: 30 } // apenas 1 adulto
    ],
    from: fromDateStr,
    to: toDateStr,
    language: "en",
    currency: "USD",
    currencyName: "Dolar",
    order: "DEFAULT"
  };

  const response = await fetch(url, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorTxt = await response.text();
    throw new Error(`Erro Activity API: ${response.status} - ${errorTxt}`);
  }

  const data = await response.json();
  return data;
}

// ---------------------------------------------------
// 3) Gravar as atividades no Supabase
//    Lógica de CRIANÇA=0 => usa preço adulto (caso apareça)
async function saveActivitiesToDB(data, fromDateStr, toDateStr) {
  if (!data.activities || !Array.isArray(data.activities)) {
    console.log("Nenhuma atividade no intervalo:", fromDateStr, toDateStr);
    return;
  }

  for (const activity of data.activities) {
    if (!activity.modalities) continue;

    for (const modality of activity.modalities) {
      if (!modality.amountsFrom) continue;

      // Pega valor ADULTO para caso CRIANÇA=0
      const adultItem = modality.amountsFrom.find(p => p.paxType === "ADULT");
      const adultPrice = adultItem ? adultItem.amount : null;

      // Cria registros
      for (const pax of modality.amountsFrom) {
        let priceType = (pax.paxType === "ADULT") ? "ADULTO"
                       : (pax.paxType === "CHILD") ? "CRIANÇA"
                       : pax.paxType;

        let finalPrice = pax.amount;
        if (priceType === "CRIANÇA" && finalPrice === 0 && adultPrice !== null) {
          finalPrice = adultPrice;
        }

        const record = {
          product_pk: "AUTO",
          park_id: "xxx-uuid",    
          name_site: modality.name || activity.name,
          id_site: modality.code,
          Images: JSON.stringify([]), 
          isSpecial: "False",
          extensions_nDays: modality.duration?.value ?? 1,
          forDate: fromDateStr,
          reqid: "hbacti-" + Date.now(),
          price_type: priceType,
          price: finalPrice,
          SKU: modality.rates?.[0]?.rateDetails?.[0]?.rateKey || null,
          id_dsd: null,
          USDBRL: 5.84
        };

        const { data: insertedData, error } = await supabase
          .from("bd_net")
          .insert(record);

        if (error) {
          console.error("Erro ao inserir bd_net:", error);
        }
      }
    }
  }
}

// ---------------------------------------------------
// 4) Função principal: 450 dias em blocos de 45
async function fetchActivitiesInChunks() {
  let currentStart = dayjs();
  const totalDays = 450;
  const chunkSize = 45; 
  const chunks = Math.ceil(totalDays / chunkSize);

  for (let i = 0; i < chunks; i++) {
    const currentEnd = currentStart.add(chunkSize - 1, "day");

    const fromStr = currentStart.format("YYYY-MM-DD");
    const toStr = currentEnd.format("YYYY-MM-DD");

    console.log(`==> Chamada #${i+1} => ${fromStr} ~ ${toStr}`);
    try {
      const result = await callActivityAPI(fromStr, toStr);
      await saveActivitiesToDB(result, fromStr, toStr);
    } catch (err) {
      console.error("Erro no bloco:", err.message);
    }

    // avançar
    currentStart = currentEnd.add(1, "day");

    // 5) Pausa de 2 segundos pra evitar rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("Concluído. Total blocos:", chunks);
}

// ---------------------------------------------------
// 6) Expor rota POST p/ iniciar esse processo
router.post("/fetchAllNext18Months", async (req, res) => {
  try {
    await fetchActivitiesInChunks(); // (MCO, 1 adulto)
    return res.json({ success: true, message: "Processo concluído" });
  } catch (err) {
    console.error("Erro geral:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
