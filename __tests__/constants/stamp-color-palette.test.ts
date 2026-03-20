import { STAMP_COLOR_PALETTE } from '@/constants/theme';
import { DEFAULT_CUSTOM_OPTIONS } from '@/types/hanami';
import type { CustomOptions } from '@/types/hanami';

describe('STAMP_COLOR_PALETTE', () => {
  it('has 8 colors', () => {
    expect(STAMP_COLOR_PALETTE).toHaveLength(8);
  });

  it('first color is sakura pink', () => {
    expect(STAMP_COLOR_PALETTE[0]).toBe('#e8a5b0');
  });
});

describe('DEFAULT_CUSTOM_OPTIONS', () => {
  it('has effectType none', () => {
    expect(DEFAULT_CUSTOM_OPTIONS.effectType).toBe('none');
  });

  it('has textMode none', () => {
    expect(DEFAULT_CUSTOM_OPTIONS.textMode).toBe('none');
  });

  it('has decorationKey none', () => {
    expect(DEFAULT_CUSTOM_OPTIONS.decorationKey).toBe('none');
  });

  it('has undefined customColor', () => {
    expect(DEFAULT_CUSTOM_OPTIONS.customColor).toBeUndefined();
  });

  it('satisfies CustomOptions type', () => {
    const _: CustomOptions = DEFAULT_CUSTOM_OPTIONS;
    expect(_).toBeDefined();
  });
});
