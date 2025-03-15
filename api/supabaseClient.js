import { createClient } from "@supabase/supabase-js";

// NÃO precisa de dotenv, pois na Vercel já está definido
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default supabase;
