// jobs/contentUpdateQueue.js
import Bull from "bull";

// Crie a fila e configure a conexão com o Redis (ajuste a URL se necessário)
export const contentUpdateQueue = new Bull("contentUpdateQueue", {
  redis: { host: process.env.REDIS_HOST || "127.0.0.1", port: process.env.REDIS_PORT || 6379 }
});
