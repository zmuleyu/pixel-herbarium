import { requireAuth, corsHeaders, jsonResponse } from '../_shared/auth.ts';

interface IdentifyRequest {
  imageBase64: string;
  lat: number;
  lon: number;
}

interface DiscoveredPlant {
  id: number;
  name_ja: string;
  name_en: string;
  name_latin: string;
  rarity: number;
  hanakotoba: string;
  flower_meaning: string;
}

interface IdentifyResponse {
  status: 'success' | 'not_a_plant' | 'no_match';
  plant?: DiscoveredPlant;
  discoveryId?: string;
}

const METERS_PER_LAT_DEGREE = 111_320;
const FUZZ_RADIUS_METERS = 100;
const PLANTID_CONFIDENCE_THRESHOLD = 0.4;

function fuzzCoordinate(lat: number, lon: number): { lat: number; lon: number } {
  const maxLatDelta = FUZZ_RADIUS_METERS / METERS_PER_LAT_DEGREE;
  const metersPerLonDegree = METERS_PER_LAT_DEGREE * Math.cos((lat * Math.PI) / 180);
  const maxLonDelta = FUZZ_RADIUS_METERS / metersPerLonDegree;
  return {
    lat: lat + (Math.random() * 2 - 1) * maxLatDelta,
    lon: lon + (Math.random() * 2 - 1) * maxLonDelta,
  };
}

async function callPlantId(imageBase64: string, apiKey: string): Promise<{
  isPlant: boolean;
  plantName: string | null;
  confidence: number;
}> {
  const res = await fetch('https://plant.id/api/v3/identification', {
    method: 'POST',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: [imageBase64],
      classification_level: 'species',
      similar_images: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Plant.id API error: ${res.status}`);
  }

  const json = await res.json();
  const result = json?.result;
  const isPlant = result?.is_plant?.binary === true;

  if (!isPlant) return { isPlant: false, plantName: null, confidence: 0 };

  const topSuggestion = result?.classification?.suggestions?.[0];
  const confidence: number = topSuggestion?.probability ?? 0;
  const plantName: string | null = confidence >= PLANTID_CONFIDENCE_THRESHOLD
    ? (topSuggestion?.name ?? null)
    : null;

  return { isPlant: true, plantName, confidence };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  try {
    const { userId, supabaseAdmin } = await requireAuth(req);
    const { imageBase64, lat, lon }: IdentifyRequest = await req.json();

    const apiKey = Deno.env.get('PLANTID_API_KEY');
    if (!apiKey) throw new Error('PLANTID_API_KEY secret not set');

    // --- Upload photo and call Plant.id in parallel ---
    const timestamp = Date.now();
    const storagePath = `${userId}/${timestamp}.jpg`;
    const imageBytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

    const [uploadResult, plantIdResult] = await Promise.all([
      supabaseAdmin.storage
        .from('discoveries-raw')
        .upload(storagePath, imageBytes, { contentType: 'image/jpeg', upsert: false }),
      callPlantId(imageBase64, apiKey),
    ]);

    if (uploadResult.error) throw uploadResult.error;
    const photoUrl = uploadResult.data.path;

    // --- Handle Plant.id result ---
    if (!plantIdResult.isPlant) {
      return jsonResponse({ status: 'not_a_plant' } as IdentifyResponse);
    }
    if (!plantIdResult.plantName) {
      return jsonResponse({ status: 'no_match' } as IdentifyResponse);
    }

    // --- Match against plants table ---
    const { data: plants, error: plantError } = await supabaseAdmin
      .from('plants')
      .select('id, name_ja, name_en, name_latin, rarity, hanakotoba, flower_meaning')
      .or(`name_latin.ilike.${plantIdResult.plantName},name_en.ilike.${plantIdResult.plantName}`)
      .limit(1);

    if (plantError) throw plantError;
    if (!plants || plants.length === 0) {
      return jsonResponse({ status: 'no_match' } as IdentifyResponse);
    }

    const plant: DiscoveredPlant = plants[0];
    const fuzzy = fuzzCoordinate(lat, lon);

    // --- Insert discovery with correct PostGIS geography format ---
    const { data: discovery, error: insertError } = await supabaseAdmin
      .from('discoveries')
      .insert({
        user_id: userId,
        plant_id: plant.id,
        photo_url: photoUrl,
        pixel_url: null,
        location: `SRID=4326;POINT(${lon} ${lat})`,
        location_fuzzy: `SRID=4326;POINT(${fuzzy.lon} ${fuzzy.lat})`,
        is_public: true,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    // --- Atomic quota deduction ---
    const month = new Date().toISOString().slice(0, 7);
    const { data: quotaOk, error: quotaError } = await supabaseAdmin.rpc('deduct_quota', {
      p_user_id: userId,
      p_month: month,
    });
    if (quotaError) throw quotaError;

    // Quota exhausted between verify and identify (race) — refund and reject
    if (!quotaOk) {
      await supabaseAdmin.rpc('refund_quota', { p_user_id: userId, p_month: month });
      return jsonResponse({ status: 'no_match' } as IdentifyResponse, 429);
    }

    return jsonResponse({
      status: 'success',
      plant,
      discoveryId: discovery.id,
    } as IdentifyResponse);
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: String(err) }, 500);
  }
});
