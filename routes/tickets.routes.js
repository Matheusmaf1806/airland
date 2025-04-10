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
  const { destination, date, activityCode, dataIngresso } = req.query;

  let tableName, dateColumn;
  let query;

  if (activityCode && dataIngresso) {
    // Se for chamada com activityCode e dataIngresso, utiliza a tabela e coluna correspondentes
    // Ajuste o nome da tabela e as colunas conforme sua modelagem de dados
    tableName = 'activities_bd';
    dateColumn = 'date';
    query = supabase
      .from(tableName)
      .select('*')
      .eq('activity_code', activityCode);
      
    // Se a data foi enviada, acrescenta o filtro
    if (dataIngresso) {
      query = query.eq(dateColumn, dataIngresso);
    }
  } else if (destination) {
    // Se for chamada com destination e date
    tableName = 'tickets';
    dateColumn = 'event_date';

    // Se o destino for MCO, usa outra tabela conforme lógica existente
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
