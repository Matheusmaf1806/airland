// routes/hbacti.js
import { Router } from "express";
import dayjs from "dayjs";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const router = Router();

// Gera assinatura pra Hotelbeds
function generateSignature() {
  const publicKey = process.env.API_KEY_HA;
  const privateKey = process.env.SECRET_KEY_HA;
  const utcDate = Math.floor(Date.now() / 1000);
  return crypto.createHash("sha256").update(publicKey + privateKey + utcDate).digest("hex");
}

// Chama a API da Hotelbeds pra "MCO" e 'paxes=1'
async function callActivityAPI(fromDateStr, toDateStr) {
  const signature = generateSignature();
  const url = "https://api.test.hotelbeds.com/activity-api/3.0/activities/availability";
  const headers = {
    "Api-key": process.env.API_KEY_HA,
    "X-Signature": signature,
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  const body = {
    filters: [
      {
        searchFilterItems: [
          { type: "destination", value: "MCO" }
        ]
      }
    ],
    paxes: [{ age: 30 }], // 1 Adulto
    from: fromDateStr,
    to: toDateStr,
    language: "en",
    currency: "USD",
    currencyName: "Dolar",
    order: "DEFAULT"
  };

  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!response.ok) {
    const errorTxt = await response.text();
    throw new Error(`Erro Activity API: ${response.status} - ${errorTxt}`);
  }

  return response.json();
}

// Salva no BD
async function saveActivities(data, fromDateStr, toDateStr) {
  if (!data.activities || !Array.isArray(data.activities)) {
    console.log("Nenhuma atividade no intervalo:", fromDateStr, toDateStr);
    return;
  }
  for (const activity of data.activities) {
    if (!activity.modalities) continue;
    for (const modality of activity.modalities) {
      if (!modality.amountsFrom) continue;
      
      // Pega valor adulto se for substituir child=0
      const adultItem = modality.amountsFrom.find(p => p.paxType === "ADULT");
      const adultPrice = adultItem ? adultItem.amount : null;

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

        const { error } = await supabase.from("bd_net").insert(record);
        if (error) console.error("Erro ao inserir no bd_net:", error);
      }
    }
  }
}

// Rota /fetchChunk: pega startDate, days => faz 1 chunk
router.post("/fetchChunk", async (req, res) => {
  try {
    const { startDate, days } = req.body;
    const chunkSize = days || 45; // se não mandar days, pega 45
    const start = dayjs(startDate || new Date());
    const end = start.add(chunkSize - 1, "day");

    const fromStr = start.format("YYYY-MM-DD");
    const toStr = end.format("YYYY-MM-DD");

    const data = await callActivityAPI(fromStr, toStr);
    await saveActivities(data, fromStr, toStr);

    return res.json({
      success: true,
      message: `Processo concluído para ${fromStr} ~ ${toStr}`
    });
  } catch (err) {
    console.error("Erro fetchChunk:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
