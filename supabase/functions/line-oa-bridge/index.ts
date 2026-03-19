// supabase/functions/line-oa-bridge/index.ts
// Sends LINE Flex Messages via the Messaging API.
// Callable only with the Supabase service role key (admin / cron usage).
//
// POST body shapes:
//   { type: 'flower_card',  user_id: string, payload: FlowerCardPayload }
//   { type: 'bloom_status', user_id: string, payload: BloomStatusPayload }
//   { type: 'seasonal',     broadcast: true, payload: SeasonalPayload }
//
// FlowerCardPayload   = { plant_name_ja, hanakotoba, plant_id, sprite_url? }
// BloomStatusPayload  = { spots: Array<{ name, prefecture, bloom_stage }> }
// SeasonalPayload     = { message_key: keyof typeof SEASONAL_MESSAGES }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL            = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY        = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') ?? '';

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Brand palette (PH design system)
// ---------------------------------------------------------------------------

const COLORS = {
  background:   '#f5f4f1',
  text:         '#3a3a3a',
  textSecondary:'#888888',
  plantPrimary: '#9fb69f',
  border:       '#e0ddd8',
};

// ---------------------------------------------------------------------------
// Seasonal message library
// ---------------------------------------------------------------------------

const SEASONAL_MESSAGES: Record<string, { altText: string; header: string; body: string }> = {
  approaching: {
    altText:  '春の足音が近づいています 🌸',
    header:   '春の足音が近づいています',
    body:     '間もなく花の季節が始まります。花めぐりを開いて、最初の一輪を探してみませんか。',
  },
  firstBloom: {
    altText:  '各地で開花便りが届き始めました 🌸',
    header:   '各地で開花便りが届き始めました',
    body:     'まだ誰も見つけていない花が、あなたを待っているかもしれません。',
  },
  fullBloom: {
    altText:  '桜が満開を迎えました 🌸',
    header:   '桜が満開を迎えました',
    body:     '今週末はお花見日和。花めぐりで今日の一輪を記録しませんか。',
  },
  end: {
    altText:  '今年もたくさんの桜に出会えました 🌸',
    header:   '今年もたくさんの花に出会えました',
    body:     'また来年、また咲きます。花図鑑に記録した思い出を、ゆっくり眺めてみてください。',
  },
};

// ---------------------------------------------------------------------------
// Flex Message builders
// ---------------------------------------------------------------------------

function buildFlowerCard(payload: {
  plant_name_ja: string;
  hanakotoba: string;
  plant_id: string;
  sprite_url?: string;
}): object {
  const deepLink = `https://pixelherbarium.app/plant/${payload.plant_id}`;
  const heroContents: object[] = payload.sprite_url
    ? [{
        type: 'image',
        url: payload.sprite_url,
        size: 'full',
        aspectRatio: '1:1',
        aspectMode: 'cover',
        backgroundColor: COLORS.background,
      }]
    : [];

  return {
    type: 'flex',
    altText: `${payload.plant_name_ja}が花図鑑に追加されました 🌸`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      ...(heroContents.length > 0 ? {
        hero: {
          type: 'box',
          layout: 'vertical',
          contents: heroContents,
          backgroundColor: COLORS.background,
          paddingAll: 'lg',
        },
      } : {}),
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        backgroundColor: COLORS.background,
        contents: [
          {
            type: 'text',
            text: payload.plant_name_ja,
            weight: 'bold',
            size: 'xl',
            color: COLORS.text,
          },
          {
            type: 'separator',
            margin: 'md',
            color: COLORS.border,
          },
          {
            type: 'text',
            text: '花言葉',
            size: 'xxs',
            color: COLORS.plantPrimary,
            margin: 'md',
          },
          {
            type: 'text',
            text: `「${payload.hanakotoba}」`,
            size: 'md',
            wrap: true,
            color: COLORS.text,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: COLORS.background,
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: COLORS.plantPrimary,
            action: {
              type: 'uri',
              label: 'この花を探しに行く',
              uri: deepLink,
            },
            height: 'sm',
          },
        ],
      },
    },
  };
}

function buildBloomStatus(payload: {
  spots: Array<{ name: string; prefecture: string; bloom_stage: string }>;
}): object {
  const BLOOM_LABELS: Record<string, string> = {
    budding: 'つぼみ',
    partial: '五分咲き',
    peak:    '満開 🌸',
    falling: '散り始め',
    ended:   '終了',
  };

  const bubbles = payload.spots.slice(0, 5).map((spot) => ({
    type: 'bubble',
    size: 'nano',
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'xs',
      backgroundColor: COLORS.background,
      contents: [
        {
          type: 'text',
          text: BLOOM_LABELS[spot.bloom_stage] ?? spot.bloom_stage,
          size: 'xxs',
          color: COLORS.plantPrimary,
          weight: 'bold',
        },
        {
          type: 'text',
          text: spot.name,
          size: 'sm',
          weight: 'bold',
          color: COLORS.text,
          wrap: true,
        },
        {
          type: 'text',
          text: spot.prefecture,
          size: 'xxs',
          color: COLORS.textSecondary,
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: COLORS.background,
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: COLORS.plantPrimary,
          action: {
            type: 'uri',
            label: '打卡する',
            uri: `https://pixelherbarium.app/spot/${encodeURIComponent(spot.name)}`,
          },
          height: 'sm',
        },
      ],
    },
  }));

  return {
    type: 'flex',
    altText: '桜の開花情報が届きました 🌸',
    contents: {
      type: 'carousel',
      contents: bubbles,
    },
  };
}

function buildSeasonal(payload: { message_key: string }): object {
  const msg = SEASONAL_MESSAGES[payload.message_key] ?? SEASONAL_MESSAGES.approaching;
  return {
    type: 'flex',
    altText: msg.altText,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        backgroundColor: COLORS.background,
        contents: [
          {
            type: 'text',
            text: msg.header,
            weight: 'bold',
            size: 'lg',
            wrap: true,
            color: COLORS.text,
          },
          {
            type: 'separator',
            color: COLORS.border,
          },
          {
            type: 'text',
            text: msg.body,
            size: 'sm',
            wrap: true,
            color: COLORS.textSecondary,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: COLORS.background,
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: COLORS.plantPrimary,
            action: {
              type: 'uri',
              label: 'アプリを開く',
              uri: 'https://pixelherbarium.app',
            },
            height: 'sm',
          },
        ],
      },
    },
  };
}

// ---------------------------------------------------------------------------
// LINE push helper
// ---------------------------------------------------------------------------

async function pushMessage(lineUid: string, message: object): Promise<void> {
  const res = await fetch(LINE_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: lineUid, messages: [message] }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LINE push failed (${res.status}): ${err}`);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  // Service role only
  const authHeader = req.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    return new Response('LINE_CHANNEL_ACCESS_TOKEN not configured', { status: 503 });
  }

  try {
    const body = await req.json();
    const { type, user_id, broadcast, payload } = body;

    // Resolve LINE UIDs
    let lineUids: string[] = [];

    if (broadcast) {
      // Send to all users who have linked LINE
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('line_uid')
        .not('line_uid', 'is', null);
      if (error) throw error;
      lineUids = (data ?? []).map((r: { line_uid: string }) => r.line_uid).filter(Boolean);
    } else if (user_id) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('line_uid')
        .eq('id', user_id)
        .maybeSingle();
      if (error) throw error;
      if (!data?.line_uid) {
        return Response.json({ ok: false, reason: 'no_line_uid' });
      }
      lineUids = [data.line_uid];
    } else {
      return new Response('user_id or broadcast required', { status: 400 });
    }

    // Build message
    let message: object;
    if (type === 'flower_card')  message = buildFlowerCard(payload);
    else if (type === 'bloom_status') message = buildBloomStatus(payload);
    else if (type === 'seasonal') message = buildSeasonal(payload);
    else return new Response(`Unknown type: ${type}`, { status: 400 });

    // Send (parallel, cap at 200 concurrent to respect LINE rate limits)
    const BATCH = 200;
    let sent = 0, failed = 0;
    for (let i = 0; i < lineUids.length; i += BATCH) {
      const batch = lineUids.slice(i, i + BATCH);
      const results = await Promise.allSettled(batch.map((uid) => pushMessage(uid, message)));
      results.forEach((r) => r.status === 'fulfilled' ? sent++ : failed++);
    }

    return Response.json({ ok: true, sent, failed, total: lineUids.length });
  } catch (err: any) {
    console.error('line-oa-bridge error:', err);
    return new Response(err.message ?? 'Internal error', { status: 500 });
  }
});
