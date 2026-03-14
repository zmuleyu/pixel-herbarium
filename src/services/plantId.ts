import * as FileSystem from 'expo-file-system';

const PLANT_ID_ENDPOINT = 'https://plant.id/api/v3/identification';
const CONFIDENCE_THRESHOLD = 0.4;

export interface PlantIdResult {
  matched: boolean;
  plantName: string | null;
  confidence: number;
  isPlant: boolean;
}

/**
 * Identifies a plant from a local image URI using Plant.id v3.
 * Throws on network or API errors.
 */
export async function identifyPlant(imageUri: string): Promise<PlantIdResult> {
  // Read image as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64',
  });

  const response = await fetch(PLANT_ID_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': process.env.EXPO_PUBLIC_PLANT_ID_KEY ?? '',
    },
    body: JSON.stringify({
      images: [`data:image/jpeg;base64,${base64}`],
      similar_images: false,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Plant.id API error ${response.status}: ${body?.error ?? 'unknown'}`);
  }

  const data = await response.json();
  const isPlant: boolean = data.result?.is_plant?.binary ?? false;
  const suggestions: Array<{ name: string; probability: number }> =
    data.result?.classification?.suggestions ?? [];
  const top = suggestions[0];
  const confidence = top?.probability ?? 0;
  const plantName = top?.name ?? null;

  const matched = isPlant && confidence >= CONFIDENCE_THRESHOLD;

  return { matched, plantName, confidence, isPlant };
}
