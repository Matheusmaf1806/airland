// scripts/chunkCaller.js
import fetch from "node-fetch";
import dayjs from "dayjs";

async function callChunk(startDateStr, days) {
  const url = "https://business.airland.com.br/api/hbacti/fetchChunk";
  const body = { startDate: startDateStr, days };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  console.log("Chunk result:", data);
}

async function main() {
  let current = dayjs(); // ou dayjs("2025-05-01") etc.
  const totalDays = 450;
  const chunkSize = 45;
  const steps = totalDays / chunkSize; // 10

  for (let i = 0; i < steps; i++) {
    const startStr = current.format("YYYY-MM-DD");
    console.log(`Processando chunk #${i+1}: ${startStr} ~ +${chunkSize} dias`);
    await callChunk(startStr, chunkSize);

    current = current.add(chunkSize, "day");

    // pausa de 2s
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log("Todos os 450 dias foram processados!");
}

main();
