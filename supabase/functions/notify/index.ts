// Seasonal push notification dispatcher.
// Call with POST { season: 'spring' | 'summer' | 'autumn' | 'winter' }
// Requires Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SEASON_MESSAGES: Record<string, { title: string; body: string }> = {
  spring: {
    title: '🌸 春の花が咲き始めました',
    body: '今日はどんな花に出会えるでしょう？カメラを持って出かけてみませんか。',
  },
  summer: {
    title: '🌻 夏の花が咲いています',
    body: 'まだ見ぬ植物がどこかで待っています。',
  },
  autumn: {
    title: '🍂 秋の草花の季節です',
    body: '色づく季節に、花図鉑を開いてみてください。',
  },
  winter: {
    title: '❄️ 冬の植物を探しに',
    body: '寒い季節にも、静かに咲く花があります。',
  },
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  // Only callable with service role key (used by cron or admin)
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (authHeader !== `Bearer ${serviceKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { season } = await req.json();
  const msg = SEASON_MESSAGES[season];
  if (!msg) {
    return new Response(`Invalid season: ${season}`, { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceKey,
  );

  // Fetch all registered device tokens
  const { data: rows, error } = await supabaseAdmin
    .from('push_tokens')
    .select('token');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!rows?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // Expo Push API accepts up to 100 messages per request
  const messages = rows.map((r: { token: string }) => ({
    to: r.token,
    title: msg.title,
    body: msg.body,
    sound: 'default',
  }));

  const pushRes = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(messages),
  });

  const pushData = await pushRes.json();

  return new Response(
    JSON.stringify({ sent: rows.length, expo: pushData }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
