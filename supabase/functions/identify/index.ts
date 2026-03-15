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
  pixel_sprite_url: string | null;
  available_window: string | null;
}

interface IdentifyResponse {
  status: 'success' | 'not_a_plant' | 'no_match';
  plant?: Omit<DiscoveredPlant, 'available_window'>;
  discoveryId?: string;
  cityRank?: number;
}

const METERS_PER_LAT_DEGREE = 111_320;
const FUZZ_RADIUS_METERS = 100;
const PLANTNET_CONFIDENCE_THRESHOLD = 0.20; // PlantNet scores are lower than Plant.id; 0.20 is a reasonable floor

function fuzzCoordinate(lat: number, lon: number): { lat: number; lon: number } {
  const maxLatDelta = FUZZ_RADIUS_METERS / METERS_PER_LAT_DEGREE;
  const metersPerLonDegree = METERS_PER_LAT_DEGREE * Math.cos((lat * Math.PI) / 180);
  const maxLonDelta = FUZZ_RADIUS_METERS / metersPerLonDegree;
  return {
    lat: lat + (Math.random() * 2 - 1) * maxLatDelta,
    lon: lon + (Math.random() * 2 - 1) * maxLonDelta,
  };
}

// Returns true if today falls within the plant's available window (or window is null = always available).
function isWithinAvailableWindow(available_window: string | null): boolean {
  if (!available_window) return true; // always available
  // Postgres DATERANGE format: "[2026-04-01,2026-04-20)" — lower-inclusive, upper-exclusive
  const match = available_window.match(/[\[{(](\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})[)\]}]/);
  if (!match) return true; // unparseable — allow
  const [, startStr, endStr] = match;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return today >= startStr && today < endStr;
}

async function callPlantNet(imageBase64: string, apiKey: string): Promise<{
  isPlant: boolean;
  plantName: string | null;
  confidence: number;
}> {
  // PlantNet requires multipart/form-data with an image file blob
  const imageBytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
  const imageBlob = new Blob([imageBytes], { type: 'image/jpeg' });

  const formData = new FormData();
  formData.append('images', imageBlob, 'plant.jpg');
  formData.append('organs', 'auto'); // let PlantNet infer: flower / leaf / fruit / bark

  const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}&lang=ja&include-related-images=false`;
  const res = await fetch(url, { method: 'POST', body: formData });

  // PlantNet returns 404 when it cannot identify any plant in the image
  if (res.status === 404) return { isPlant: false, plantName: null, confidence: 0 };
  if (!res.ok) throw new Error(`PlantNet API error: ${res.status}`);

  const json = await res.json();
  const results: Array<{ score: number; species: { scientificNameWithoutAuthor: string } }> =
    json?.results ?? [];

  if (results.length === 0) return { isPlant: true, plantName: null, confidence: 0 };

  const top = results[0];
  const confidence = top.score ?? 0;
  const plantName = confidence >= PLANTNET_CONFIDENCE_THRESHOLD
    ? (top.species?.scientificNameWithoutAuthor ?? null)
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

    const apiKey = Deno.env.get('PLANTNET_API_KEY');
    if (!apiKey) throw new Error('PLANTNET_API_KEY secret not set');

    // --- Upload photo and call PlantNet in parallel ---
    const timestamp = Date.now();
    const storagePath = `${userId}/${timestamp}.jpg`;
    const imageBytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

    const [uploadResult, plantNetResult] = await Promise.all([
      supabaseAdmin.storage
        .from('discoveries-raw')
        .upload(storagePath, imageBytes, { contentType: 'image/jpeg', upsert: false }),
      callPlantNet(imageBase64, apiKey),
    ]);

    if (uploadResult.error) throw uploadResult.error;
    const photoUrl = uploadResult.data.path;

    // --- Handle PlantNet result ---
    if (!plantNetResult.isPlant) {
      return jsonResponse({ status: 'not_a_plant' } as IdentifyResponse);
    }
    if (!plantNetResult.plantName) {
      return jsonResponse({ status: 'no_match' } as IdentifyResponse);
    }

    // --- Match against plants table (include available_window and pixel_sprite_url) ---
    const { data: plants, error: plantError } = await supabaseAdmin
      .from('plants')
      .select('id, name_ja, name_en, name_latin, rarity, hanakotoba, flower_meaning, pixel_sprite_url, available_window')
      .or(`name_latin.ilike.${plantNetResult.plantName},name_en.ilike.${plantNetResult.plantName}`)
      .limit(1);

    if (plantError) throw plantError;
    if (!plants || plants.length === 0) {
      return jsonResponse({ status: 'no_match' } as IdentifyResponse);
    }

    const plant: DiscoveredPlant = plants[0];

    // --- Enforce seasonal availability for ★★★ plants ---
    if (!isWithinAvailableWindow(plant.available_window)) {
      return jsonResponse({ status: 'no_match' } as IdentifyResponse);
    }

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

    // Compute global rank: how many distinct users discovered this plant before (excluding current user)
    const { count: othersCount } = await supabaseAdmin
      .from('discoveries')
      .select('user_id', { count: 'exact', head: true })
      .eq('plant_id', plant.id)
      .neq('user_id', userId)
      .then((r) => ({ count: r.count ?? 0 }));
    const cityRank = (othersCount as number) + 1;

    // Strip available_window before returning to client
    const { available_window: _aw, ...plantForClient } = plant;
    return jsonResponse({
      status: 'success',
      plant: plantForClient,
      discoveryId: discovery.id,
      cityRank,
    } as IdentifyResponse);
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: String(err) }, 500);
  }
});
