import { type ImageSourcePropType } from 'react-native';
import { getPlantSprite } from '@/constants/sprites';

/**
 * Resolves the best available image source for a plant.
 * Priority: remote URL (pixel_sprite_url from DB) → bundled placeholder sprite.
 * Returns null if neither is available.
 */
export function resolvePlantImage(
  plantId: number,
  pixelSpriteUrl: string | null,
): ImageSourcePropType | null {
  if (pixelSpriteUrl) return { uri: pixelSpriteUrl };
  const bundled = getPlantSprite(plantId);
  return bundled ?? null;
}
