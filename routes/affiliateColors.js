// routes/api/affiliateColors.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Rota GET: /api/affiliateColors?host=airland.com.br
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const host = searchParams.get('host') || request.headers.get('host');

  if (!host) {
    return new Response(JSON.stringify({ error: 'Host inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cleanHost = host.replace(/^www\./, '');

  const { data, error } = await supabase
    .from('affiliates')
    .select('primary_color, button_color, button_text_color, button_hover, background_color')
    .eq('domain', cleanHost)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Afiliado não encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
