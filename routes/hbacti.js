//////////////////////////////////////////////////////////////
// routes/hbacti.js
// Exemplo final:
// - POST /fetchChunk
// - Chama a API Hotelbeds Activities
// - Insere tudo em "activities_bd" (uma só tabela)
// - Usa a coluna "date" (DATE) para gravar fromStr (data do chunk)
//////////////////////////////////////////////////////////////

import { Router } from "express";
import dayjs from "dayjs";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// 1) Inicializar supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const router = Router();

// 2) Gera assinatura (Hotelbeds)
function generateSignature() {
  console.log("[generateSignature] API_KEY_HA =", process.env.API_KEY_HA);
  console.log("[generateSignature] SECRET_KEY_HA =", process.env.SECRET_KEY_HA);

  const utcDate = Math.floor(Date.now() / 1000);
  const assemble = (process.env.API_KEY_HA || "") + (process.env.SECRET_KEY_HA || "") + utcDate;
  const hash = crypto.createHash("sha256").update(assemble).digest("hex");

  console.log(`[generateSignature] signature (first 10) = ${hash.substring(0, 10)}...`);
  return hash;
}

// 3) Chama a API de Activities
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

  const body = {
    filters: [
      {
        searchFilterItems: [
          { type: "destination", value: "MCO" }
        ]
      }
    ],
    paxes: [{ age: 30 }], // 1 adulto
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
  console.log("[callActivityAPI] data.activities length =", data.activities?.length || 0);
  return data;
}

// 4) Salvar no BD (tabela "activities_bd"), incluindo "date"
async function saveActivitiesToOneTable(data, fromStr, toStr) {
  console.log("[saveActivitiesToOneTable] Intervalo =", fromStr, "~", toStr);

  if (!data.activities || !Array.isArray(data.activities)) {
    console.log("Nenhuma atividade no intervalo:", fromStr, toStr);
    return;
  }

  const records = [];

  for (const activity of data.activities) {
    // Campos gerais
    const activityCode = activity.activityCode;  
    const codeExterno  = activity.code;          
    const nome         = activity.name;          
    const tipo         = activity.type;          
    const currency     = activity.currency || null;

    // country / destinations
    let countryCode    = "";
    let countryName    = "";
    let destinationCode   = "";
    let destinationName   = "";

    if (activity.country) {
      countryCode = activity.country.code || "";
      countryName = activity.country.name || "";
      if (activity.country.destinations && activity.country.destinations.length > 0) {
        destinationCode = activity.country.destinations[0].code || "";
        destinationName = activity.country.destinations[0].name || "";
      }
    }

    // operationDays => array
    let operationCodes = [];
    if (activity.operationDays && Array.isArray(activity.operationDays)) {
      operationCodes = activity.operationDays.map(d => d.code || "");
    }

    // amountsFrom (top-level)
    let topLevelChildPrice = null;
    let topLevelAdultPrice = null;
    if (activity.amountsFrom && Array.isArray(activity.amountsFrom)) {
      for (const a of activity.amountsFrom) {
        if (a.paxType === "CHILD") topLevelChildPrice = a.amount;
        if (a.paxType === "ADULT") topLevelAdultPrice = a.amount;
      }
    }

    // redeemInfo
    let redeemInfo = "";
    if (activity.content && activity.content.redeemInfo) {
      const r = activity.content.redeemInfo;
      if (r.comments && Array.isArray(r.comments)) {
        redeemInfo = r.comments.map(c => c.description).join(" ");
      }
    }

    // media => JSON
    let mediaJson = [];
    if (activity.content && activity.content.media && activity.content.media.images) {
      mediaJson = activity.content.media.images;
    }

    // highlights => array
    let highlights = [];
    if (activity.content && Array.isArray(activity.content.highligths)) {
      highlights = activity.content.highligths;
    }

    // descricao => content.description
    let descricao = "";
    if (activity.content && activity.content.description) {
      descricao = activity.content.description;
    }

    // modalities
    if (!activity.modalities || !Array.isArray(activity.modalities)) {
      console.log("Atividade sem modalities, ignorado:", activityCode);
      continue;
    }

    for (const modality of activity.modalities) {
      const modalityCode = modality.code || "";
      const modalityName = modality.name || "";

      let durationVal = null;
      if (modality.duration && modality.duration.value) {
        durationVal = modality.duration.value; 
      }

      let amountChild = null;
      let amountAdult = null;
      if (modality.amountsFrom && Array.isArray(modality.amountsFrom)) {
        for (const am of modality.amountsFrom) {
          if (am.paxType === "CHILD") amountChild = am.amount;
          if (am.paxType === "ADULT") amountAdult = am.amount;
        }
      }

      let rateKey = null;
      let boxOffice = null;
      let sessionsArr = [];

      if (modality.rates && modality.rates.length > 0) {
        const rate = modality.rates[0];
        if (rate.rateDetails && rate.rateDetails.length > 0) {
          const rd = rate.rateDetails[0];
          rateKey = rd.rateKey || null;

          if (rd.totalAmount) {
            boxOffice = rd.totalAmount.boxOfficeAmount || null;
          }
          if (rd.sessions && rd.sessions.length > 0) {
            sessionsArr = rd.sessions.map(s => s.code); 
          }
        }
      }

      // Cada "record" vira uma linha
      // Adicionamos a coluna date, que vai receber fromStr
      const record = {
        activity_code: activityCode,
        code_externo:  codeExterno,
        nome,
        tipo,

        country_code: countryCode,
        country_name: countryName,
        destination_code: destinationCode,
        destination_name: destinationName,

        operation_days: operationCodes, // TEXT[]

        modality_code: modalityCode,
        modality_name: modalityName,
        duration: durationVal,

        amount_child: amountChild,
        amount_adult: amountAdult,

        rate_key: rateKey,
        box_office_amount: boxOffice,

        sessions: sessionsArr,         // TEXT[]
        redeem_info: redeemInfo,
        media: mediaJson,              // JSONB
        highlights,
        descricao,

        top_level_child_price: topLevelChildPrice,
        top_level_adult_price: topLevelAdultPrice,
        currency,

        // Aqui armazenamos a data do chunk
        date: fromStr  // <--- Salva a data do "fromStr" do chunk
      };

      records.push(record);
    }
  }

  console.log(`[saveActivitiesToOneTable] Montou ${records.length} registros para inserir.`);

  if (records.length > 0) {
    const { data: insertedData, error } = await supabase
      .from("activities_bd")  // Tabela que já tem a coluna "date" do tipo DATE
      .insert(records);

    if (error) {
      console.error("[saveActivitiesToOneTable] Erro ao inserir no BD:", error);
    } else {
      console.log(`[saveActivitiesToOneTable] Inseriu ${records.length} registros com sucesso!`);
    }
  } else {
    console.log("[saveActivitiesToOneTable] Nenhum registro a inserir.");
  }
}

// 5) Rota POST /fetchChunk
router.post("/fetchChunk", async (req, res) => {
  console.log("[fetchChunk] body recebido:", req.body);
  try {
    const { startDate, days } = req.body;
    console.log(`[fetchChunk] startDate=${startDate}, days=${days}`);

    const chunkSize = days || 45;

    // Se data no passado, força "amanhã"
    const now = dayjs();
    const tomorrow = now.add(1, "day");
    let start = dayjs(startDate);
    if (!startDate || start.isBefore(now, "day")) {
      start = tomorrow;
      console.log(`[fetchChunk] Ajustando data para amanhã => ${start.format("YYYY-MM-DD")}`);
    }

    const end = start.add(chunkSize - 1, "day");
    const fromStr = start.format("YYYY-MM-DD");
    const toStr   = end.format("YYYY-MM-DD");

    console.log(`[fetchChunk] from=${fromStr}, to=${toStr}`);

    // 1) Chama API
    const data = await callActivityAPI(fromStr, toStr);

    // 2) Salva na tabela "activities_bd"
    await saveActivitiesToOneTable(data, fromStr, toStr);

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
