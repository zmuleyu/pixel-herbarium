export type DeepLinkTarget =
  | { type: 'plant'; id: string }
  | { type: 'spot'; id: string }
  | { type: 'invite'; code: string };

export function parseDeepLink(url: string | null | undefined): DeepLinkTarget | null {
  if (!url) return null;

  try {
    const normalized = url
      .replace('pixelherbarium://', 'https://pixelherbarium.app/')
      .replace(/\?.*$/, '');

    const { pathname } = new URL(normalized);
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length < 2) return null;

    const [type, value] = segments;

    switch (type) {
      case 'plant': return { type: 'plant', id: value };
      case 'spot':  return { type: 'spot', id: value };
      case 'invite': return { type: 'invite', code: value };
      default: return null;
    }
  } catch {
    return null;
  }
}
