// supabase/functions/auth-line/index.ts
// Verifies LINE id_token + nonce, creates or matches a Supabase user,
// returns {access_token, refresh_token} for the app to call setSession().

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// Admin client — user management only
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Anon client — used for verifyOtp to get a real session
const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY, {
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
    const { id_token, nonce, confirm_link, existing_user_id } = await req.json();
    if (!id_token) {
      return Response.json(
        { error: 'id_tokenが必要です' },
        { status: 400, headers: corsHeaders },
      );
    }

    // 1. Verify LINE token (always — even for confirm_link, to prevent spoofing)
    const payload = await verifyLineToken(id_token, nonce);
    const lineUid = payload.sub;

    let userId: string;
    let userEmail: string;

    // 1b. confirm_link path: user approved merging LINE into existing account
    if (confirm_link && existing_user_id) {
      const { data: existingAuth } = await supabaseAdmin.auth.admin.getUserById(existing_user_id);
      if (!existingAuth.user) throw new Error('existing_user_id not found');

      // Write line_uid into the profile
      await supabaseAdmin
        .from('profiles')
        .update({ line_uid: lineUid })
        .eq('id', existing_user_id);

      userId = existing_user_id;
      userEmail = existingAuth.user.email!;
    } else {
      // 2. Normal flow: check if user with this line_uid already exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('line_uid', lineUid)
        .maybeSingle();

      if (existingProfile) {
        // Returning LINE user — look up their email
        userId = existingProfile.id;
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        userEmail = authUser.user?.email ?? `line_${lineUid}@line.users.noreply`;
      } else {
        // Check for account linking via verified email
        if (payload.email && payload.email_verified) {
          const { data: emailUsers } = await supabaseAdmin.auth.admin.listUsers();
          const matchedUser = emailUsers?.users?.find((u) => u.email === payload.email);

          if (matchedUser) {
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
        userEmail = (payload.email && payload.email_verified)
          ? payload.email
          : `line_${lineUid}@line.users.noreply`;

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userEmail,
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
    }

    // 3. Generate a magic-link OTP and immediately verify it to get a session.
    //    (supabase-js v2 has no admin.createSession — this is the correct pattern.)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });
    if (linkError) throw new Error(`generateLink: ${linkError.message}`);

    const otp = linkData.properties?.email_otp;
    if (!otp) throw new Error('generateLink returned no email_otp');

    const { data: sessionData, error: sessionError } = await supabaseAnon.auth.verifyOtp({
      email: userEmail,
      token: otp,
      type: 'email',
    });
    if (sessionError) throw new Error(`verifyOtp: ${sessionError.message}`);
    if (!sessionData.session) throw new Error('verifyOtp returned no session');

    return Response.json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      user: { id: userId, email: userEmail },
    }, { headers: corsHeaders });

  } catch (err: any) {
    console.error('auth-line error:', err);
    return Response.json(
      { error: '接続できませんでした。もう一度お試しください' },
      { status: 401, headers: corsHeaders },
    );
  }
});
