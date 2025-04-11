// routes/tickets.routes.js

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Obtenha as variáveis de ambiente do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/', async (req, res) => {
  // Recebe os parâmetros tanto para destination/date quanto para activityCode/dataIngresso
  const { destination, date, activityCode, dataIngresso, start_date, end_date } = req.query;

  let tableName, dateColumn;
  let query;

  if (activityCode) {
    // Se a consulta usar activityCode (usada para activities_bd)
    tableName = 'activities_bd';
    dateColumn = 'date';
    query = supabase
      .from(tableName)
      .select('*')
      .eq('activity_code', activityCode);
      
    // Se foram enviados start_date e end_date, filtra um intervalo de datas
    if (start_date && end_date) {
      query = query.gte(dateColumn, start_date).lte(dateColumn, end_date);
    }
    // Senão, se for apenas dataIngresso, filtra por essa data exata
    else if (dataIngresso) {
      query = query.eq(dateColumn, dataIngresso);
    }
  } else if (destination) {
    // Se a consulta usar destination e date (para tabela tickets)
    tableName = 'tickets';
    dateColumn = 'event_date';

    // Se o destino for MCO, usa outra tabela (activities_bd) conforme sua lógica
    if (destination.toUpperCase() === 'MCO') {
      tableName = 'activities_bd';
      dateColumn = 'date';
    }
    query = supabase
      .from(tableName)
      .select('*')
      .eq('destination_code', destination);
      
    if (date) {
      query = query.eq(dateColumn, date);
    }
  } else {
    return res.status(400).json({ error: 'Informe os parâmetros necessários (destination/date ou activityCode/dataIngresso).' });
  }

  try {
    const { data, error } = await query;
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Erro ao buscar ingressos/activities:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
