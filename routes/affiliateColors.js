// routes/affiliateColors.js

import { createClient } from '@supabase/supabase-js';

// Cria o cliente do Supabase com as variáveis corretas
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function getAffiliateColors(req, res) {
  try {
    const rawHost = req.query.host || req.headers.host;

    if (!rawHost) {
      return res.status(400).json({ error: 'Host inválido' });
    }

    // Limpa o protocolo (http, https) e o "www."
    const cleanHost = rawHost
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .trim();

    // Faz a busca no Supabase em domain OU subdomain
    const { data, error } = await supabase
      .from('affiliates')
      .select('primary_color, button_color, button_text_color, button_hover, background_color')
      .or(`domain.eq.${cleanHost},subdomain.eq.${cleanHost}`)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Afiliado não encontrado' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Erro no affiliateColors:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
