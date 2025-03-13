// db.js
const mysql = require('mysql2/promise');

let pool;

async function initDB() {
  pool = await mysql.createPool({
    host: "localhost",
    user: "crassu24_matheus",
    password: "ek6khHvk*zJKvFk",
    database: "crassu24_airlandbd",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log("Conexão MySQL estabelecida.");
}

function getPool() {
  if (!pool) {
    throw new Error("Pool não inicializada. Execute initDB() primeiro.");
  }
  return pool;
}

module.exports = { initDB, getPool };