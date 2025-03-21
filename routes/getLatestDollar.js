// api/getLatestDollar.js

// Importa o cliente do Supabase
const { createClient } = require('@supabase/supabase-js');

// Carrega as credenciais do Supabase a partir de variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ou SUPABASE_ANON_KEY, se apropriado
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  try {
    // Busca o último registro da tabela "dollar" ordenando por last_updated de forma decrescente
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

    // Retorna o registro encontrado
    res.status(200).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado: ' + err.message });
  }
};
