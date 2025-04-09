// routes/tickets.routes.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Obtenha as variáveis de ambiente do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rota GET para buscar ingressos/ingressos/activities
router.get('/', async (req, res) => {
  // Recebe os parâmetros destination (código do destino) e data (data do evento)
  const { destination, date } = req.query;
  if (!destination) {
    return res.status(400).json({ error: 'O parâmetro "destination" é obrigatório.' });
  }

  try {
    // Se o destination for "MCO" (Orlando), use a tabela "activities_bd"
    // Caso contrário, use a tabela "tickets"
    let tableName = 'tickets';
    if (destination.toUpperCase() === 'MCO') {
      tableName = 'activities_bd';
    }

    // Construa a query no Supabase
    let query = supabase
      .from(tableName)
      .select('*')
      .eq('destination_code', destination);

    // Se a data for informada, adicione o filtro. (Ajuste o nome da coluna, se necessário.)
    if (date) {
      query = query.eq('event_date', date);
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
