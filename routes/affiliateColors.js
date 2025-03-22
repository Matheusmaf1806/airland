// routes/affiliateColors.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function getAffiliateColors(req, res) {
  try {
    const host = req.query.host || req.headers.host;

    if (!host) {
      return res.status(400).json({ error: 'Host inválido' });
    }

    const cleanHost = host.replace(/^www\./, '');

    const { data, error } = await supabase
      .from('affiliates')
      .select('primary_color, button_color, button_text_color, button_hover, background_color')
      .eq('domain', cleanHost)
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
