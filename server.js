import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto"; // Importado para gerar UUID corretamente

// Criando cliente do Supabase com as variáveis de ambiente da Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const app = express();
app.use(express.json());

// 🔹 Função para buscar os domínios permitidos na tabela "affiliates"
async function getAllowedOrigins() {
  try {
    const { data, error } = await supabase.from("affiliates").select("domain");
    if (error) throw error;

    // Remover valores nulos antes de retornar
    return data.map(row => row.domain).filter(domain => domain);
  } catch (err) {
    console.error("Erro ao buscar domínios permitidos:", err);
    return [];
  }
}

// 🔹 Configuração do CORS com base na tabela `affiliates`
(async function configureCors() {
  const allowedOrigins = await getAllowedOrigins();
  console.log("Domínios permitidos:", allowedOrigins);

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error("Origin not allowed by CORS"));
        }
      }
    })
  );
})();

// 🔹 Definição de rotas da API

// 📌 Criar/Cadastrar Ingresso Compartilhado
app.post("/shareCart", async (req, res) => {
  try {
    const { affiliateId, agentId, items } = req.body;
    if (!affiliateId || !agentId || !items) {
      return res.status(400).json({ error: "affiliateId, agentId e items são obrigatórios." });
    }

    const shareId = crypto.randomUUID();
    const { error } = await supabase
      .from("shared_carts")
      .insert([{ share_id: shareId, affiliate_id: affiliateId, agent_id: agentId, items }]);

    if (error) throw error;
    return res.json({ success: true, shareId });
  } catch (err) {
    console.error("Erro ao criar ingresso compartilhado:", err);
    return res.status(500).json({ error: "Erro interno ao criar ingresso compartilhado" });
  }
});

// 📌 Buscar Ingresso Compartilhado
app.get("/cart/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;
    const { data, error } = await supabase
      .from("shared_carts")
      .select("*")
      .eq("share_id", shareId)
      .single();

    if (error) return res.status(404).json({ error: "Ingresso compartilhado não encontrado" });

    return res.json({ success: true, ...data });
  } catch (err) {
    console.error("Erro ao buscar ingresso compartilhado:", err);
    return res.status(500).json({ error: "Erro interno ao buscar ingresso compartilhado" });
  }
});

// 📌 Atualizar Ingresso Compartilhado
app.post("/updateCart", async (req, res) => {
  try {
    const { shareId, items } = req.body;
    if (!shareId || !items) {
      return res.status(400).json({ error: "shareId e items são obrigatórios" });
    }

    const { error } = await supabase
      .from("shared_carts")
      .update({ items })
      .eq("share_id", shareId);

    if (error) throw error;

    return res.json({ success: true, shareId });
  } catch (err) {
    console.error("Erro ao atualizar ingresso compartilhado:", err);
    return res.status(500).json({ error: "Erro interno ao atualizar ingresso compartilhado" });
  }
});

// 📌 Limpar Ingresso Compartilhado
app.post("/clearCart", async (req, res) => {
  try {
    const { shareId } = req.body;
    if (!shareId) {
      return res.status(400).json({ error: "shareId é obrigatório" });
    }

    const { error } = await supabase
      .from("shared_carts")
      .delete()
      .eq("share_id", shareId);

    if (error) throw error;

    return res.json({ success: true, message: "Ingresso removido" });
  } catch (err) {
    console.error("Erro ao limpar ingresso compartilhado:", err);
    return res.status(500).json({ error: "Erro interno ao limpar ingresso compartilhado" });
  }
});

// 📌 Buscar Preços dos Ingressos
app.get("/prices", async (req, res) => {
  try {
    const { id_site, start_date, end_date } = req.query;

    if (!id_site || !start_date || !end_date) {
      return res.status(400).json({ error: "id_site, start_date e end_date são obrigatórios" });
    }

    const { data, error } = await supabase
      .from("bd_net")
      .select("*")
      .eq("id_site", id_site)
      .gte("forDate", start_date)
      .lte("forDate", end_date);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar preços dos ingressos:", err);
    res.status(500).json({ error: "Erro ao buscar preços dos ingressos" });
  }
});

// 📌 Buscar Margens dos Afiliados
app.get("/margins/affiliates", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("affiliate_categories_margin")
      .select("*");

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar margens dos afiliados:", err);
    res.status(500).json({ error: "Erro ao buscar margens dos afiliados" });
  }
});

// 📌 Adicionando uma resposta para a rota `/` para evitar erro "Cannot GET /"
app.get("/", (req, res) => {
  res.send("API Airland está rodando 🚀");
});

// 🔹 Exporta o app para a Vercel
export default app;
