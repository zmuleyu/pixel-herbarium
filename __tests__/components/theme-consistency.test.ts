/**
 * Theme token consistency tests.
 * Imports the actual theme module (no mock) to verify token values are valid.
 */

import { colors, spacing, typography, borderRadius } from '@/constants/theme';

describe('theme token consistency', () => {
  it('all color values are valid hex strings', () => {
    function isHex(v: unknown): v is string {
      return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
    }
    function checkColors(obj: Record<string, unknown>) {
      for (const [, v] of Object.entries(obj)) {
        if (typeof v === 'object' && v !== null) {
          checkColors(v as Record<string, unknown>);
        } else {
          expect(isHex(v)).toBe(true);
        }
      }
    }
    checkColors(colors as unknown as Record<string, unknown>);
  });

  it('all spacing values are multiples of 4', () => {
    for (const [, v] of Object.entries(spacing)) {
      expect(v % 4).toBe(0);
    }
  });

  it('rarity colors are defined for 3 levels', () => {
    expect(colors.rarity.common).toBeDefined();
    expect(colors.rarity.uncommon).toBeDefined();
    expect(colors.rarity.rare).toBeDefined();
  });

  it('typography fontSize values are positive numbers', () => {
    for (const [, v] of Object.entries(typography.fontSize)) {
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThan(0);
    }
  });

  it('borderRadius values are non-negative', () => {
    for (const [, v] of Object.entries(borderRadius)) {
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});
