import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL, // Use variáveis de ambiente para não expor as credenciais
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { id_site, start_date, end_date } = req.query;

  if (!id_site || !start_date || !end_date) {
    return res.status(400).json({ error: 'Faltam parâmetros obrigatórios.' });
  }

  // Consultar a tabela de preços no Supabase
  const { data, error } = await supabase
    .from('prices')  // Ajuste o nome da tabela conforme sua estrutura
    .select('*')
    .eq('id_site', id_site)
    .gte('forDate', start_date)
    .lte('forDate', end_date);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}
