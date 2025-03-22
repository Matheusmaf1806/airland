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
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, telefone, affiliateId } = req.body;
    if (!name || !email || !password || !telefone) {
      return res.status(400).json({ success: false, error: "Campos obrigatórios não preenchidos." });
    }

    // Verifica se já existe um usuário com o mesmo email
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, error: "Email já está em uso." });
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
      .select() // Retorna o registro inserido
      .single();
    
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    if (!data) {
      return res.status(500).json({ success: false, error: "Nenhum dado retornado após o registro." });
    }
    
    // Gera um token JWT com expiração de 1 dia
    const token = jwt.sign({ userId: data.id }, JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, maxAge: 86400000 });
    
    return res.json({ success: true, user: data });
  } catch (err) {
    console.error("Erro no registro:", err);
    return res.status(500).json({ success: false, error: "Erro interno no registro." });
  }
});

// =======================================================
// POST /api/users/login (AGORA FUNCIONA COM EMAIL + SENHA)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Valida os campos obrigatórios
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email e senha são obrigatórios." });
    }

    // Buscar usuário pelo email
    const { data, error } = await supabase
      .from("users")
      .select("id, email, password, name, telefone")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: "Usuário não encontrado." });
    }

    // Verifica a senha com bcrypt.compare()
    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Senha incorreta." });
    }

    // Gera o token JWT
    const token = jwt.sign({ userId: data.id }, JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, maxAge: 86400000 });

    return res.json({ success: true, user: { id: data.id, email: data.email, name: data.name, telefone: data.telefone } });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ success: false, error: "Erro interno no login." });
  }
});

export default router;
