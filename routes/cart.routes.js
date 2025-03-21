import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Crie o cliente do Supabase utilizando SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = Router();

/**
 * POST /shareCart - Cria um novo carrinho compartilhado e retorna um shareId.
 */
router.post("/shareCart", async (req, res) => {
  try {
    const { affiliateId, agentId, items } = req.body;
    
    if (!items) {
      return res.status(400).json({ success: false, error: "Nenhum item fornecido." });
    }
    
    // Gera um share_id único (ex.: 16 caracteres hexadecimais)
    const share_id = crypto.randomBytes(8).toString("hex");
    
    // Insere o novo carrinho na tabela "shared_carts"
    const { data, error } = await supabase
      .from("shared_carts")
      .insert([
        {
          share_id,
          affiliate_id: affiliateId,
          agent_id: agentId,
          items, // deve ser um objeto JSON
        }
      ])
      .single();
      
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    return res.json({ success: true, shareId: share_id });
  } catch (err) {
    console.error("Erro no /shareCart:", err);
    return res.status(500).json({ success: false, error: "Erro interno" });
  }
});

/**
 * POST /updateCart - Atualiza o carrinho com base no shareId.
 */
router.post("/updateCart", async (req, res) => {
  try {
    const { shareId, items } = req.body;
    
    if (!shareId || !items) {
      return res.status(400).json({ success: false, error: "Parâmetros shareId e items são obrigatórios." });
    }
    
    const { data, error } = await supabase
      .from("shared_carts")
      .update({
        items,
        updated_at: new Date()
      })
      .eq("share_id", shareId);
      
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    return res.json({ success: true });
  } catch (err) {
    console.error("Erro no /updateCart:", err);
    return res.status(500).json({ success: false, error: "Erro interno" });
  }
});

/**
 * GET /cart/:shareId - Retorna os itens do carrinho com base no shareId.
 */
router.get("/cart/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;
    
    if (!shareId) {
      return res.status(400).json({ success: false, error: "Parâmetro shareId ausente." });
    }
    
    const { data, error } = await supabase
      .from("shared_carts")
      .select("items")
      .eq("share_id", shareId)
      .single();
      
    if (error) {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    return res.json({ success: true, items: data.items });
  } catch (err) {
    console.error("Erro no GET /cart/:shareId:", err);
    return res.status(500).json({ success: false, error: "Erro interno" });
  }
});

/**
 * POST /clearCart - Remove o carrinho do banco com base no shareId.
 */
router.post("/clearCart", async (req, res) => {
  try {
    const { shareId } = req.body;
    
    if (!shareId) {
      return res.status(400).json({ success: false, error: "Parâmetro shareId ausente." });
    }
    
    const { data, error } = await supabase
      .from("shared_carts")
      .delete()
      .eq("share_id", shareId);
      
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    return res.json({ success: true });
  } catch (err) {
    console.error("Erro no /clearCart:", err);
    return res.status(500).json({ success: false, error: "Erro interno" });
  }
});

export default router;
