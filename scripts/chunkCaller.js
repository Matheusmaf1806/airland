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
  let current = dayjs(); // Data inicial
  const totalDays = 450;
  const chunkSize = 7;   // <-- Reduzimos para 7 dias
  const steps = totalDays / chunkSize; // ~64

  for (let i = 0; i < steps; i++) {
    const startStr = current.format("YYYY-MM-DD");
    console.log(`Processando chunk #${i+1}: ${startStr} + ${chunkSize} dias`);
    await callChunk(startStr, chunkSize);

    // Avança 7 dias
    current = current.add(chunkSize, "day");

    // Pausa 2s
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log("Todos os 450 dias foram processados!");
}

main();
