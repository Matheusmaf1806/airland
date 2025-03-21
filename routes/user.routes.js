import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

// Crie o cliente do Supabase utilizando as variáveis de ambiente
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Secret para o JWT (definido na Vercel via environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "seuSegredoDefault";

// =======================================================
// POST /api/users/register
// Registra um novo usuário com os campos: name, email, password, telefone e affiliateId.
// Separa o nome em primeiro_nome e ultimo_nome.
// Após o registro, gera um token JWT com expiração de 1 dia e o envia como cookie.
router.post("/users/register", async (req, res) => {
  try {
    const { name, email, password, telefone, affiliateId } = req.body;
    if (!name || !email || !password || !telefone) {
      return res.status(400).json({ success: false, error: "Campos obrigatórios não preenchidos." });
    }
    
    // Separar o nome em primeiro_nome e ultimo_nome
    const nameParts = name.split(" ");
    const primeiro_nome = nameParts[0];
    const ultimo_nome = nameParts.slice(1).join(" ") || null;
    
    // Hashear a senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Inserir o usuário na tabela "users"
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
      .single();
    
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    // Gera um token JWT com expiração de 1 dia
    const token = jwt.sign({ userId: data.id }, JWT_SECRET, { expiresIn: "1d" });
    // Define o cookie 'token' com httpOnly e duração de 1 dia (86400000 ms)
    res.cookie("token", token, { httpOnly: true, maxAge: 86400000 });
    
    return res.json({ success: true, user: data });
  } catch (err) {
    console.error("Erro no registro:", err);
    return res.status(500).json({ success: false, error: "Erro interno no registro." });
  }
});

// =======================================================
// POST /api/users/login
// Realiza o login do usuário usando name, email e telefone.
// Após encontrar o usuário, gera um token JWT com expiração de 1 dia e o envia como cookie.
router.post("/users/login", async (req, res) => {
  try {
    const { name, email, telefone } = req.body;
    if (!name || !email || !telefone) {
      return res.status(400).json({ success: false, error: "Campos obrigatórios não preenchidos." });
    }
    
    // Buscar usuário na tabela "users" com os dados informados
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("name", name)
      .eq("telefone", telefone)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ success: false, error: "Usuário não encontrado." });
    }
    
    // Gera o token JWT com expiração de 1 dia
    const token = jwt.sign({ userId: data.id }, JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, maxAge: 86400000 });
    
    return res.json({ success: true, user: data });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ success: false, error: "Erro interno no login." });
  }
});

export default router;
