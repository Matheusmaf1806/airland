// server.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());
// Use o CORS; as configurações podem ser personalizadas via variáveis de ambiente
app.use(cors());

let pool;

// Função para inicializar a conexão com o MySQL
async function initDB() {
  pool = await mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "crassu24_matheus",
    password: process.env.DB_PASS || "ek6khHvk*zJKvFk",
    database: process.env.DB_NAME || "crassu24_airlandbd",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log("Conexão MySQL estabelecida.");
}

// Função para buscar os domínios permitidos na tabela de afiliados
async function getAllowedOrigins() {
  try {
    const [rows] = await pool.query("SELECT domain FROM affiliates");
    return rows.map(row => row.domain);
  } catch (err) {
    console.error("Erro ao buscar domínios permitidos:", err);
    return [];
  }
}

// Função para definir as rotas da API
function initRoutes() {
  // Endpoint para criar/cadastrar carrinho
  app.post("/shareCart", async (req, res) => {
    try {
      const { affiliateId, agentId, items } = req.body;
      if (!affiliateId || !agentId || !items) {
        return res.status(400).json({ error: "affiliateId, agentId e items são obrigatórios." });
      }
      const shareId = uuidv4();
      const itemsJson = JSON.stringify(items);
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

  // Endpoint para obter o carrinho
  app.get("/cart/:shareId", async (req, res) => {
    try {
      const { shareId } = req.params;
      const sql = "SELECT * FROM shared_carts WHERE share_id = ? LIMIT 1";
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
        items: JSON.parse(cart.items),
        createdAt: cart.created_at,
        updatedAt: cart.updated_at
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno ao buscar carrinho" });
    }
  });

  // Endpoint para atualizar o carrinho
  app.post("/updateCart", async (req, res) => {
    try {
      const { shareId, items } = req.body;
      if (!shareId || !items) {
        return res.status(400).json({ error: "shareId e items são obrigatórios" });
      }
      const checkSql = "SELECT * FROM shared_carts WHERE share_id = ? LIMIT 1";
      const conn = await pool.getConnection();
      const [rows] = await conn.query(checkSql, [shareId]);
      if (rows.length === 0) {
        conn.release();
        return res.status(404).json({ error: "Carrinho não encontrado" });
      }
      const itemsJson = JSON.stringify(items);
      const updateSql = "UPDATE shared_carts SET items = ? WHERE share_id = ? LIMIT 1";
      await conn.query(updateSql, [itemsJson, shareId]);
      conn.release();
      return res.json({ success: true, shareId });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno ao atualizar carrinho" });
    }
  });

  // Endpoint para limpar o carrinho
  app.post("/clearCart", async (req, res) => {
    try {
      const { shareId } = req.body;
      if (!shareId) {
        return res.status(400).json({ error: "shareId é obrigatório" });
      }
      const conn = await pool.getConnection();
      const [rows] = await conn.query("SELECT * FROM shared_carts WHERE share_id = ? LIMIT 1", [shareId]);
      if (rows.length === 0) {
        conn.release();
        return res.status(404).json({ error: "Carrinho não encontrado" });
      }
      await conn.query("DELETE FROM shared_carts WHERE share_id = ? LIMIT 1", [shareId]);
      conn.release();
      return res.json({ success: true, message: "Carrinho removido" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno ao limpar carrinho" });
    }
  });

  // Endpoint para obter preços dos ingressos
  app.get("/prices", async (req, res) => {
    try {
      const { id_site, start_date, end_date } = req.query;
      const [rows] = await pool.query(
        "SELECT * FROM bd_net WHERE id_site = ? AND forDate BETWEEN ? AND ?",
        [id_site, start_date, end_date]
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao buscar preços" });
    }
  });

  // Endpoint para obter margens dos afiliados
  app.get("/margins/affiliates", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM affiliate_categories_margin");
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao buscar margens dos afiliados" });
    }
  });
}

// Inicia o servidor e configura o CORS com os domínios permitidos
(async function startServer() {
  try {
    await initDB();
    const allowedOrigins = await getAllowedOrigins();
    console.log("Domínios permitidos:", allowedOrigins);

    // Se nenhum domínio for encontrado na tabela, permite todas as origens (não é ideal para produção)
    if (allowedOrigins.length === 0) {
      app.use(cors());
      console.warn("Nenhum domínio permitido encontrado; permitindo todas as origens.");
    } else {
      // Reconfigura o CORS para aceitar apenas os domínios da lista
      app.use(
        cors({
          origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) {
              return callback(null, true);
            } else {
              return callback(new Error("Origin not allowed by CORS"));
            }
          }
        })
      );
    }

    initRoutes();

    // Se estiver rodando na Vercel (variável de ambiente VERCEL definida) exporta o app para funcionar como função serverless;
    // caso contrário, inicia o servidor normalmente.
    if (process.env.VERCEL) {
      module.exports = app;
    } else {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error("Erro ao iniciar o servidor:", err);
  }
})();