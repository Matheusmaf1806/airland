// routes/hbacti.js
import { Router } from "express";
import dayjs from "dayjs";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// ----------------------------------------
// 1) Inicializar supabase client
// ----------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const router = Router();

// ----------------------------------------
// 2) Gera assinatura pra Hotelbeds
// ----------------------------------------
function generateSignature() {
  console.log("[generateSignature] API_KEY_HA =", process.env.API_KEY_HA);
  console.log("[generateSignature] SECRET_KEY_HA =", process.env.SECRET_KEY_HA);

  const publicKey = process.env.API_KEY_HA;
  const privateKey = process.env.SECRET_KEY_HA;
  const utcDate = Math.floor(Date.now() / 1000);

  const assemble = publicKey + privateKey + utcDate;
  const hash = crypto.createHash("sha256").update(assemble).digest("hex");

  console.log(`[generateSignature] signature (first 10) = ${hash.substring(0, 10)}...`);
  return hash;
}

// ----------------------------------------
// 3) Chama a API da Hotelbeds (Activities)
// ----------------------------------------
async function callActivityAPI(fromDateStr, toDateStr) {
  console.log(`[callActivityAPI] from=${fromDateStr}, to=${toDateStr}`);

  const signature = generateSignature();
  const url = "https://api.test.hotelbeds.com/activity-api/3.0/activities/availability";
  const headers = {
    "Api-key": process.env.API_KEY_HA,
    "X-Signature": signature,
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  // Exemplo: MCO + 1 Adult
  const body = {
    filters: [
      {
        searchFilterItems: [
          {
            type: "destination",
            value: "MCO"
          }
        ]
      }
    ],
    paxes: [{ age: 30 }], // 1 Adult
    from: fromDateStr,
    to: toDateStr,
    language: "en",
    currency: "USD",
    currencyName: "Dolar",
    order: "DEFAULT"
  };

  console.log("[callActivityAPI] POST body =", body);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  console.log("[callActivityAPI] response status =", response.status);

  if (!response.ok) {
    const errorTxt = await response.text();
    console.error("[callActivityAPI] Erro text:", errorTxt);
    throw new Error(`Erro Activity API: ${response.status} - ${errorTxt}`);
  }

  const data = await response.json();
  console.log("[callActivityAPI] data.activities length =",
    data.activities?.length || 0
  );
  return data;
}

// ----------------------------------------
// 4) Salva as atividades no BD (com logs)
//    e faz batch insert para agilizar
// ----------------------------------------
async function saveActivities(data, fromDateStr, toDateStr) {
  console.log(`[saveActivities] Iniciando. Intervalo ${fromDateStr} ~ ${toDateStr}`);

  if (!data.activities || !Array.isArray(data.activities)) {
    console.log("Nenhuma atividade no intervalo:", fromDateStr, toDateStr);
    return;
  }

  console.log("[saveActivities] Número de atividades =", data.activities.length);

  // --- Exemplo: montar array de records e fazer 1 insert de batch
  const records = [];

  for (const activity of data.activities) {
    if (!activity.modalities) continue;

    for (const modality of activity.modalities) {
      if (!modality.amountsFrom) continue;

      // Valor do Adulto, se for substituir child=0
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

        records.push(record);
      }
    }
  }

  console.log(`[saveActivities] Montou ${records.length} registros para inserir.`);

  if (records.length > 0) {
    // 1) Insert em lote
    const { data: supaData, error } = await supabase
      .from("bd_net")
      .insert(records);

    if (error) {
      console.error("[saveActivities] Erro ao inserir no bd_net:", error);
    } else {
      console.log(`[saveActivities] Inseriu ${records.length} registros com sucesso!`);
    }
  } else {
    console.log("[saveActivities] Nenhum registro a inserir.");
  }
}

// ----------------------------------------
// 5) Rota /fetchChunk
// ----------------------------------------
router.post("/fetchChunk", async (req, res) => {
  console.log("[fetchChunk] body recebido:", req.body);
  try {
    const { startDate, days } = req.body;
    console.log(`[fetchChunk] startDate=${startDate}, days=${days}`);

    const chunkSize = days || 45;
    const start = dayjs(startDate || new Date());
    const end = start.add(chunkSize - 1, "day");

    const fromStr = start.format("YYYY-MM-DD");
    const toStr = end.format("YYYY-MM-DD");

    console.log(`[fetchChunk] from=${fromStr}, to=${toStr}`);

    // Chamar a API e salvar
    const data = await callActivityAPI(fromStr, toStr);
    await saveActivities(data, fromStr, toStr);

    return res.json({
      success: true,
      message: `Processo concluído para ${fromStr} ~ ${toStr}`
    });
  } catch (err) {
    console.error("Erro fetchChunk:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
