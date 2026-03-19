// supabase/functions/auth-line/index.ts
// Verifies LINE id_token + nonce, creates or matches a Supabase user,
// returns {access_token, refresh_token} for the app to call setSession().

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface LineTokenPayload {
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
}

async function verifyLineToken(idToken: string, nonce?: string): Promise<LineTokenPayload> {
  const channelId = Deno.env.get('LINE_CHANNEL_ID');
  if (!channelId) throw new Error('LINE_CHANNEL_ID not configured');

  const params: Record<string, string> = { id_token: idToken, client_id: channelId };
  if (nonce) params.nonce = nonce;

  const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LINE token verification failed: ${err}`);
  }

  return await res.json();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id_token, nonce } = await req.json();
    if (!id_token) {
      return Response.json(
        { error: 'id_tokenが必要です' },
        { status: 400, headers: corsHeaders },
      );
    }

    // 1. Verify LINE token (with nonce if provided)
    const payload = await verifyLineToken(id_token, nonce);
    const lineUid = payload.sub;

    // 2. Check if user with this line_uid already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('line_uid', lineUid)
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      // Returning LINE user
      userId = existingProfile.id;
    } else {
      // Check if a user with matching verified email already exists (account linking)
      if (payload.email && payload.email_verified) {
        const { data: emailUsers } = await supabase.auth.admin.listUsers();
        const matchedUser = emailUsers?.users?.find(
          (u) => u.email === payload.email
        );

        if (matchedUser) {
          // Email match found — return special response for client-side confirmation
          return Response.json({
            requires_linking: true,
            existing_user_id: matchedUser.id,
            line_uid: lineUid,
            line_name: payload.name,
            message: 'このメールアドレスのアカウントが見つかりました。統合しますか？',
          }, { headers: corsHeaders });
        }
      }

      // No match — create new user
      const email = (payload.email && payload.email_verified)
        ? payload.email
        : `line_${lineUid}@line.users.noreply`;

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: payload.name ?? '',
          avatar_url: payload.picture ?? '',
          line_uid: lineUid,
          provider: 'line',
        },
      });

      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // 3. Generate session via admin API (avoids confirmation_token NULL issue)
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: userId,
    });
    if (sessionError) throw sessionError;

    return Response.json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      user: { id: userId, email: sessionData.session.user?.email ?? '' },
    }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('auth-line error:', err);
    return Response.json(
      { error: '接続できませんでした。もう一度お試しください' },
      { status: 401, headers: corsHeaders },
    );
  }
});
