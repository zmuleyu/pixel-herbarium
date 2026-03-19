import { getStampColors } from '@/utils/stamp-colors';

describe('getStampColors', () => {
  it('returns darker variants of sakura themeColor', () => {
    const result = getStampColors('#e8a5b0');
    expect(result.brandDeep).toBeDefined();
    expect(result.brandMid).toBeDefined();
    expect(result.brandDeep).not.toBe('#e8a5b0');
    expect(result.brandMid).not.toBe('#e8a5b0');
    expect(result.brandDeep).not.toBe(result.brandMid);
  });

  it('handles edge case of very dark input', () => {
    const result = getStampColors('#333333');
    expect(result.brandDeep).toBeDefined();
    expect(result.brandMid).toBeDefined();
  });
});
