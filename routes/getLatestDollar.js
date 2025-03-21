// routes/getLatestDollar.js (versão ESM)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ou SUPABASE_ANON_KEY, se apropriado
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function (req, res) {
  try {
    const { data, error } = await supabase
      .from('dollar')
      .select('*')
      .order('last_updated', { ascending: false })
      .limit(1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Nenhum registro encontrado.' });
    }

    res.status(200).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado: ' + err.message });
  }
}
