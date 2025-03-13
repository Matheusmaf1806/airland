// server.js
const express = require("express");
const mysql = require("mysql2/promise");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

// Conexão ao MySQL (ajuste as credenciais conforme necessário)
let pool;
(async function initDB() {
  pool = await mysql.createPool({
    host: "localhost",                // ou outro host, se estiver remoto
    user: "crassu24_matheus",
    password: "ek6khHvk*zJKvFk",
    database: "crassu24_airlandbd",
    port: 3306,                       // se necessário
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log("Conexão MySQL estabelecida.");
})();

// Rota: Criar/Compartilhar carrinho
// Recebe affiliateId, agentId e items (array de objetos, ex: [{ id: "...", quantity: 2 }, ...])
// Retorna shareId
app.post("/shareCart", async (req, res) => {
  try {
    const { affiliateId, agentId, items } = req.body;
    if (!affiliateId || !agentId || !items) {
      return res.status(400).json({ error: "affiliateId, agentId e items são obrigatórios." });
    }

    // Gera share_id (UUID)
    const shareId = uuidv4();
    // Converte os itens para JSON
    const itemsJson = JSON.stringify(items);

    // Insere no banco de dados
    const sql = `
      INSERT INTO shared_carts (share_id, affiliate_id, agent_id, items)
      VALUES (?, ?, ?, ?)
    `;
    const conn = await pool.getConnection();
    await conn.query(sql, [shareId, affiliateId, agentId, itemsJson]);
    conn.release();

    return res.json({ success: true, shareId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao criar carrinho" });
  }
});

// Rota: Obter carrinho (GET /cart/:shareId)
app.get("/cart/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;
    const sql = `SELECT * FROM shared_carts WHERE share_id = ? LIMIT 1`;

    const conn = await pool.getConnection();
    const [rows] = await conn.query(sql, [shareId]);
    conn.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: "Carrinho não encontrado" });
    }

    const cart = rows[0];
    return res.json({
      success: true,
      shareId: cart.share_id,
      affiliateId: cart.affiliate_id,
      agentId: cart.agent_id,
      items: JSON.parse(cart.items), // os itens são enviados sem preço
      createdAt: cart.created_at,
      updatedAt: cart.updated_at
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao buscar carrinho" });
  }
});

// Rota: Atualizar carrinho (POST /updateCart)
// Recebe shareId e items atualizados
app.post("/updateCart", async (req, res) => {
  try {
    const { shareId, items } = req.body;
    if (!shareId || !items) {
      return res.status(400).json({ error: "shareId e items são obrigatórios" });
    }

    // Verifica se o carrinho existe
    const checkSql = `SELECT * FROM shared_carts WHERE share_id = ? LIMIT 1`;
    const conn = await pool.getConnection();
    const [rows] = await conn.query(checkSql, [shareId]);
    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ error: "Carrinho não encontrado" });
    }

    // Atualiza os itens
    const itemsJson = JSON.stringify(items);
    const updateSql = `
      UPDATE shared_carts
      SET items = ?
      WHERE share_id = ?
      LIMIT 1
    `;
    await conn.query(updateSql, [itemsJson, shareId]);
    conn.release();

    return res.json({ success: true, shareId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao atualizar carrinho" });
  }
});

// Rota: Limpar carrinho (POST /clearCart)
// Remove a linha do carrinho do banco de dados
app.post("/clearCart", async (req, res) => {
  try {
    const { shareId } = req.body;
    if (!shareId) {
      return res.status(400).json({ error: "shareId é obrigatório" });
    }
    const conn = await pool.getConnection();
    // Verifica se o carrinho existe
    const [rows] = await conn.query(`SELECT * FROM shared_carts WHERE share_id=? LIMIT 1`, [shareId]);
    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ error: "Carrinho não encontrado." });
    }
    // Remove o carrinho
    await conn.query(`DELETE FROM shared_carts WHERE share_id=? LIMIT 1`, [shareId]);
    conn.release();

    return res.json({ success: true, message: "Carrinho removido" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao limpar carrinho" });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});