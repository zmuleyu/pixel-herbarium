import { parseDeepLink } from '@/utils/deep-link';

describe('parseDeepLink', () => {
  it('parses custom scheme plant link', () => {
    expect(parseDeepLink('pixelherbarium://plant/42')).toEqual({ type: 'plant', id: '42' });
  });

  it('parses custom scheme spot link', () => {
    expect(parseDeepLink('pixelherbarium://spot/5')).toEqual({ type: 'spot', id: '5' });
  });

  it('parses custom scheme invite link', () => {
    expect(parseDeepLink('pixelherbarium://invite/abc123')).toEqual({ type: 'invite', code: 'abc123' });
  });

  it('parses universal link (https)', () => {
    expect(parseDeepLink('https://pixelherbarium.app/plant/42')).toEqual({ type: 'plant', id: '42' });
  });

  it('strips query params', () => {
    expect(parseDeepLink('pixelherbarium://plant/42?ref=line')).toEqual({ type: 'plant', id: '42' });
  });

  it('returns null for unknown type', () => {
    expect(parseDeepLink('pixelherbarium://unknown/path')).toBeNull();
  });

  it('returns null for empty/null', () => {
    expect(parseDeepLink(null)).toBeNull();
    expect(parseDeepLink('')).toBeNull();
    expect(parseDeepLink(undefined)).toBeNull();
  });

  it('returns null for malformed URL', () => {
    expect(parseDeepLink('pixelherbarium://')).toBeNull();
    expect(parseDeepLink('not-a-url')).toBeNull();
  });
});
