import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Obtenha as variáveis de ambiente do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/', async (req, res) => {
  // Recebe os parâmetros: destination (código do destino) e date (data no formato yyyy-mm-dd)
  const { destination, date } = req.query;
  if (!destination) {
    return res.status(400).json({ error: 'O parâmetro "destination" é obrigatório.' });
  }
  try {
    let tableName = 'tickets';
    let dateColumn = 'event_date'; // Coluna de data para a tabela tickets

    // Se o destino for MCO, use a tabela activities_bd e a coluna "date"
    if (destination.toUpperCase() === 'MCO') {
      tableName = 'activities_bd';
      dateColumn = 'date';
    }

    // Construa a query
    let query = supabase
      .from(tableName)
      .select('*')
      .eq('destination_code', destination);
      
    if (date) {
      query = query.eq(dateColumn, date);
    }

    const { data, error } = await query;

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Erro ao buscar ingressos/activities:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
