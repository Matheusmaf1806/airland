// routes/autocomplete.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

router.get('/', async (req, res) => {
  const term = req.query.term;
  if (!term) {
    return res.status(400).json({ error: 'O parâmetro "term" é obrigatório.' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY; // Certifique-se de usar a chave correta
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY não definidas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('locations')
      .select('country_name, country_code, destination_name, destination_code')
      .ilike('destination_name', `%${term}%`)
      .limit(10);

    if (error) throw error;
    // data deve ser um array com os registros
    return res.json(data);
  } catch (err) {
    console.error('Erro no autocomplete:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
