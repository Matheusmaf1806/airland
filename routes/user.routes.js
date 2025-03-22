import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || "seuSegredoDefault";

// =======================================================
// POST /api/users/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, telefone, affiliateId } = req.body;
    if (!name || !email || !password || !telefone) {
      return res.status(400).json({ success: false, error: "Campos obrigatórios não preenchidos." });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, error: "Email já está em uso." });
    }

    const nameParts = name.split(" ");
    const primeiro_nome = nameParts[0];
    const ultimo_nome = nameParts.slice(1).join(" ") || null;

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          telefone,
          affiliate_id: affiliateId ? parseInt(affiliateId) : null,
          primeiro_nome,
          ultimo_nome,
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const token = jwt.sign({ userId: data.id }, JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, maxAge: 86400000 });

    return res.json({ success: true, user: data });
  } catch (err) {
    console.error("Erro no registro:", err);
    return res.status(500).json({ success: false, error: "Erro interno no registro." });
  }
});

// =======================================================
// POST /api/users/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email e senha são obrigatórios." });
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, email, password, name, telefone, primeiro_nome")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: "Usuário não encontrado." });
    }

    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Senha incorreta." });
    }

    const token = jwt.sign({ userId: data.id }, JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, maxAge: 86400000 });

    return res.json({
      success: true,
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        telefone: data.telefone,
        primeiro_nome: data.primeiro_nome,
      }
    });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ success: false, error: "Erro interno no login." });
  }
});

// =======================================================
// GET /api/users/profile?id=xyz
router.get("/profile", async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "ID do usuário não informado." });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("primeiro_nome")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.json(data);
  } catch (err) {
    console.error("Erro ao buscar perfil do usuário:", err);
    return res.status(500).json({ error: "Erro interno ao buscar perfil." });
  }
});

export default router;
