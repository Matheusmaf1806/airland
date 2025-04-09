// routes/tickets.routes.js
import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

// Obtenha as variáveis de ambiente do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rota GET para buscar ingressos
router.get('/', async (req, res) => {
  // Espera parâmetros: destination (o código do destino) e opcionalmente data
  const { destination, date } = req.query;
  if (!destination) {
    return res.status(400).json({ error: 'O parâmetro "destination" é obrigatório.' });
  }
  try {
    // Começa a construir a query para a tabela "tickets"
    let query = supabase
      .from('tickets')
      .select('*')
      .eq('destination_code', destination);

    // Se foi especificada uma data, adicione o filtro (ajuste o nome da coluna conforme seu banco)
    if (date) {
      query = query.eq('event_date', date);
    }

    const { data, error } = await query;

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Erro ao buscar ingressos:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
