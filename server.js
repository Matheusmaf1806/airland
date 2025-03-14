import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

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
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao criar carrinho" });
  }
});

app.get("/cart/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;
    const { data, error } = await supabase
      .from("shared_carts")
      .select("*")
      .eq("share_id", shareId)
      .single();

    if (error) return res.status(404).json({ error: "Carrinho não encontrado" });

    return res.json({ success: true, ...data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao buscar carrinho" });
  }
});

app.post("/updateCart", async (req, res) => {
  try {
    const { shareId, items } = req.body;
    if (!shareId || !items) {
      return res.status(400).json({ error: "shareId e items são obrigatórios." });
    }

    const { error } = await supabase
      .from("shared_carts")
      .update({ items })
      .eq("share_id", shareId);

    if (error) throw error;

    return res.json({ success: true, shareId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao atualizar carrinho" });
  }
});

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

    return res.json({ success: true, message: "Carrinho removido" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao limpar carrinho" });
  }
});

app.get("/prices", async (req, res) => {
  try {
    const { id_site, start_date, end_date } = req.query;
    const { data, error } = await supabase
      .from("bd_net")
      .select("*")
      .eq("id_site", id_site)
      .gte("forDate", start_date)
      .lte("forDate", end_date);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar preços" });
  }
});

app.get("/margins/affiliates", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("affiliate_categories_margin")
      .select("*");

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar margens dos afiliados" });
  }
});

// 🔹 Exporta o app para a Vercel (corrige o erro "No exports found in module")
export default app;
