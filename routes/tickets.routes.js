// routes/tickets.routes.js

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Obtenha as variáveis de ambiente do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/', async (req, res) => {
  // Recebe os parâmetros para destination/date ou activityCode/dataIngresso
  // Também contempla os parâmetros start_date e end_date para intervalos de datas
  const { destination, date, activityCode, dataIngresso, start_date, end_date } = req.query;

  let tableName, dateColumn;
  let query;

  if (activityCode) {
    // Se a consulta for feita por activityCode, utilizamos a tabela 'activities_bd'
    tableName = 'activities_bd';
    dateColumn = 'date';
    query = supabase
      .from(tableName)
      .select('*')
      .eq('activity_code', activityCode);
      
    // Se start_date e end_date estiverem presentes, filtra pelo intervalo completo
    if (start_date && end_date) {
      query = query.gte(dateColumn, start_date).lte(dateColumn, end_date);
    }
    // Senão, se for passado apenas dataIngresso (um dia específico), filtra por esse dia exato
    else if (dataIngresso) {
      query = query.eq(dateColumn, dataIngresso);
    }
  } else if (destination) {
    // Se a consulta for feita por destination, a tabela padrão é 'tickets'
    tableName = 'tickets';
    dateColumn = 'event_date';

    // Se o destination for "MCO", usamos a tabela 'activities_bd' e a coluna "date"
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
