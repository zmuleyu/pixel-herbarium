import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthContext {
  userId: string;
  supabaseAdmin: ReturnType<typeof createClient>;
}

export async function requireAuth(req: Request): Promise<AuthContext> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (!user || error) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return { userId: user.id, supabaseAdmin };
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
