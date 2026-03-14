import { requireAuth, corsHeaders, jsonResponse } from '../_shared/auth.ts';

interface PixelateRequest {
  discoveryId: string;
}

// Default model: pixel art style via Replicate.
// Override with REPLICATE_PIXEL_ART_MODEL secret after completing Week 1-2 spike.
const DEFAULT_MODEL = 'zeke-xie/stable-diffusion-pixel-art';
const REPLICATE_POLL_INTERVAL_MS = 3_000;
const REPLICATE_MAX_WAIT_MS = 60_000;

async function pollReplicatePrediction(
  predictionId: string,
  apiToken: string,
): Promise<string> {
  const deadline = Date.now() + REPLICATE_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, REPLICATE_POLL_INTERVAL_MS));
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Token ${apiToken}` },
    });
    const json = await res.json();
    if (json.status === 'succeeded') {
      const outputUrl: string = Array.isArray(json.output) ? json.output[0] : json.output;
      if (!outputUrl) throw new Error('Replicate returned no output URL');
      return outputUrl;
    }
    if (json.status === 'failed' || json.status === 'canceled') {
      throw new Error(`Replicate prediction ${json.status}: ${json.error ?? ''}`);
    }
  }
  throw new Error('Replicate prediction timed out after 60s');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  try {
    const { userId, supabaseAdmin } = await requireAuth(req);
    const { discoveryId }: PixelateRequest = await req.json();

    const apiToken = Deno.env.get('REPLICATE_API_TOKEN');
    if (!apiToken) throw new Error('REPLICATE_API_TOKEN secret not set');

    const modelId = Deno.env.get('REPLICATE_PIXEL_ART_MODEL') ?? DEFAULT_MODEL;

    // --- Fetch the discovery and verify ownership ---
    const { data: discovery, error: fetchError } = await supabaseAdmin
      .from('discoveries')
      .select('id, photo_url, user_id')
      .eq('id', discoveryId)
      .single();

    if (fetchError) throw fetchError;
    if (!discovery) throw new Error('Discovery not found');
    if (discovery.user_id !== userId) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    // --- Generate a signed URL for the original photo (valid 1hr for Replicate) ---
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('discoveries-raw')
      .createSignedUrl(discovery.photo_url, 3600);
    if (signedError) throw signedError;

    // --- Submit prediction to Replicate ---
    const predictionRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: modelId,
        input: {
          image: signedData.signedUrl,
          prompt: 'pixel art style, 16-bit retro game sprite, clean outlines, flat colors',
          negative_prompt: 'blurry, realistic, photographic',
          num_inference_steps: 20,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!predictionRes.ok) {
      const errText = await predictionRes.text();
      throw new Error(`Replicate submit failed: ${predictionRes.status} ${errText}`);
    }

    const prediction = await predictionRes.json();
    const pixelArtUrl = await pollReplicatePrediction(prediction.id, apiToken);

    // --- Download pixel art and re-upload to Supabase Storage ---
    const imageRes = await fetch(pixelArtUrl);
    if (!imageRes.ok) throw new Error('Failed to download Replicate output');
    const imageBytes = new Uint8Array(await imageRes.arrayBuffer());

    const pixelStoragePath = `${discoveryId}.png`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('discoveries-pixel')
      .upload(pixelStoragePath, imageBytes, { contentType: 'image/png', upsert: true });
    if (uploadError) throw uploadError;

    // --- Get public URL for pixel art ---
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('discoveries-pixel')
      .getPublicUrl(pixelStoragePath);

    // --- Update discovery record ---
    const { error: updateError } = await supabaseAdmin
      .from('discoveries')
      .update({ pixel_url: publicUrlData.publicUrl })
      .eq('id', discoveryId);
    if (updateError) throw updateError;

    return jsonResponse({ pixelUrl: publicUrlData.publicUrl });
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: String(err) }, 500);
  }
});
