// routes/autocomplete.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// As credenciais serão lidas das variáveis de ambiente definidas no Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/', async (req, res) => {
  const term = req.query.term;
  if (!term) {
    return res.status(400).json({ error: 'O parâmetro "term" é obrigatório.' });
  }
  try {
    // Pesquisa no campo destination_name (você pode expandir para outros campos se necessário)
    const { data, error } = await supabase
      .from('locations')
      .select('country_name, country_code, destination_name, destination_code')
      .ilike('destination_name', `%${term}%`)
      .limit(10);

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
