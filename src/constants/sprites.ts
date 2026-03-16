// Bundled placeholder pixel art sprites for all 60 spring plants.
// Used as fallback when pixel_sprite_url from Supabase is NULL.
// Replace with Replicate-generated sprites when API token is available.

const SPRITE_MAP: Record<number, any> = {
  1: require('../../assets/sprites/plant_1.png'),
  2: require('../../assets/sprites/plant_2.png'),
  3: require('../../assets/sprites/plant_3.png'),
  4: require('../../assets/sprites/plant_4.png'),
  5: require('../../assets/sprites/plant_5.png'),
  6: require('../../assets/sprites/plant_6.png'),
  7: require('../../assets/sprites/plant_7.png'),
  8: require('../../assets/sprites/plant_8.png'),
  9: require('../../assets/sprites/plant_9.png'),
  10: require('../../assets/sprites/plant_10.png'),
  11: require('../../assets/sprites/plant_11.png'),
  12: require('../../assets/sprites/plant_12.png'),
  13: require('../../assets/sprites/plant_13.png'),
  14: require('../../assets/sprites/plant_14.png'),
  15: require('../../assets/sprites/plant_15.png'),
  16: require('../../assets/sprites/plant_16.png'),
  17: require('../../assets/sprites/plant_17.png'),
  18: require('../../assets/sprites/plant_18.png'),
  19: require('../../assets/sprites/plant_19.png'),
  20: require('../../assets/sprites/plant_20.png'),
  21: require('../../assets/sprites/plant_21.png'),
  22: require('../../assets/sprites/plant_22.png'),
  23: require('../../assets/sprites/plant_23.png'),
  24: require('../../assets/sprites/plant_24.png'),
  25: require('../../assets/sprites/plant_25.png'),
  26: require('../../assets/sprites/plant_26.png'),
  27: require('../../assets/sprites/plant_27.png'),
  28: require('../../assets/sprites/plant_28.png'),
  29: require('../../assets/sprites/plant_29.png'),
  30: require('../../assets/sprites/plant_30.png'),
  31: require('../../assets/sprites/plant_31.png'),
  32: require('../../assets/sprites/plant_32.png'),
  33: require('../../assets/sprites/plant_33.png'),
  34: require('../../assets/sprites/plant_34.png'),
  35: require('../../assets/sprites/plant_35.png'),
  36: require('../../assets/sprites/plant_36.png'),
  37: require('../../assets/sprites/plant_37.png'),
  38: require('../../assets/sprites/plant_38.png'),
  39: require('../../assets/sprites/plant_39.png'),
  40: require('../../assets/sprites/plant_40.png'),
  41: require('../../assets/sprites/plant_41.png'),
  42: require('../../assets/sprites/plant_42.png'),
  43: require('../../assets/sprites/plant_43.png'),
  44: require('../../assets/sprites/plant_44.png'),
  45: require('../../assets/sprites/plant_45.png'),
  46: require('../../assets/sprites/plant_46.png'),
  47: require('../../assets/sprites/plant_47.png'),
  48: require('../../assets/sprites/plant_48.png'),
  49: require('../../assets/sprites/plant_49.png'),
  50: require('../../assets/sprites/plant_50.png'),
  51: require('../../assets/sprites/plant_51.png'),
  52: require('../../assets/sprites/plant_52.png'),
  53: require('../../assets/sprites/plant_53.png'),
  54: require('../../assets/sprites/plant_54.png'),
  55: require('../../assets/sprites/plant_55.png'),
  56: require('../../assets/sprites/plant_56.png'),
  57: require('../../assets/sprites/plant_57.png'),
  58: require('../../assets/sprites/plant_58.png'),
  59: require('../../assets/sprites/plant_59.png'),
  60: require('../../assets/sprites/plant_60.png'),
};

/**
 * Get the bundled placeholder sprite for a plant by ID.
 * Returns the require() source for <Image source={...} />.
 * Returns undefined if no sprite exists for the given ID.
 */
export function getPlantSprite(plantId: number): any | undefined {
  return SPRITE_MAP[plantId];
}
