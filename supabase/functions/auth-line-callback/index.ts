/**
 * auth-line-callback
 *
 * LINE redirects here (HTTPS required by LINE console).
 * This function immediately redirects to the app's custom scheme,
 * passing through all query parameters (code, state, error).
 *
 * LINE console Callback URL:
 *   https://uwdgnueaycatmkzkbxwo.supabase.co/functions/v1/auth-line-callback
 */
Deno.serve((req: Request) => {
  const url = new URL(req.url);
  const params = url.searchParams.toString();

  // Redirect to native app scheme, preserving all LINE params
  const appUrl = `pixelherbarium://auth/line/callback${params ? `?${params}` : ''}`;

  return new Response(null, {
    status: 302,
    headers: { Location: appUrl },
  });
});
