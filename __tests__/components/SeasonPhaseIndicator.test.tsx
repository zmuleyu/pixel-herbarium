/**
 * SeasonPhaseIndicator component tests.
 * Uses a recursive shallowRender helper to call the function component
 * without a React fiber context (avoids react-test-renderer issues in React 19).
 *
 * Petal active/inactive state is verified by inspecting backgroundColor
 * in the JSON-stringified render tree.
 */

import React from 'react';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/utils/date', () => ({
  getSeasonPhase: jest.fn().mockReturnValue({ phase: 'budding' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/constants/theme', () => ({
  colors: { plantPrimary: '#9fb69f', border: '#e8e6e1', text: '#3a3a3a', white: '#ffffff' },
  typography: { fontSize: { sm: 13 }, fontFamily: { display: 'HiraginoMaruGothicProN' } },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  borderRadius: { md: 12 },
}));

import { SeasonPhaseIndicator } from '@/components/SeasonPhaseIndicator';
import { getSeasonPhase } from '@/utils/date';

// ── Recursive render helper ───────────────────────────────────────────────────

function shallowRender(element: any, depth = 15): any {
  if (element == null || typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') {
    return element;
  }
  if (Array.isArray(element)) {
    return element.map((e) => shallowRender(e, depth));
  }
  if (!element.type) return element;

  // Function component — call it to get its output
  if (typeof element.type === 'function' && depth > 0) {
    try {
      const output = element.type({ ...element.props });
      return shallowRender(output, depth - 1);
    } catch {
      return null;
    }
  }

  // Host component (string type)
  const children = element.props?.children;
  return {
    type: typeof element.type === 'string' ? element.type : (element.type?.name ?? 'Unknown'),
    props: { ...element.props, children: undefined },
    children: children != null ? shallowRender(children, depth) : undefined,
  };
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const defaultProps = {
  bloomMonths: [3, 4, 5],
  rarity: 1,
  availableWindow: null,
};

function renderToJson(props = defaultProps): string {
  const element = React.createElement(SeasonPhaseIndicator, props);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SeasonPhaseIndicator – null for always phase', () => {
  it('returns null for "always" phase', () => {
    (getSeasonPhase as jest.Mock).mockReturnValue({ phase: 'always' });
    const element = React.createElement(SeasonPhaseIndicator, defaultProps);
    const tree = shallowRender(element);
    expect(tree).toBeNull();
  });
});

describe('SeasonPhaseIndicator – phase rendering', () => {
  it('renders for budding phase with correct icon and label key', () => {
    (getSeasonPhase as jest.Mock).mockReturnValue({ phase: 'budding' });
    const output = renderToJson();
    expect(output).toContain('🌱');
    expect(output).toContain('season.budding');
  });

  it('renders for peak phase with correct icon and label key', () => {
    (getSeasonPhase as jest.Mock).mockReturnValue({ phase: 'peak' });
    const output = renderToJson();
    expect(output).toContain('🌸');
    expect(output).toContain('season.peak');
  });

  it('renders for falling phase with correct icon and label key', () => {
    (getSeasonPhase as jest.Mock).mockReturnValue({ phase: 'falling' });
    const output = renderToJson();
    expect(output).toContain('🍃');
    expect(output).toContain('season.falling');
  });

  it('renders for dormant phase with correct icon and label key', () => {
    (getSeasonPhase as jest.Mock).mockReturnValue({ phase: 'dormant' });
    const output = renderToJson();
    expect(output).toContain('🌿');
    expect(output).toContain('season.dormant');
  });
});

describe('SeasonPhaseIndicator – i18n', () => {
  it('uses i18n t() for label, not a hardcoded string', () => {
    (getSeasonPhase as jest.Mock).mockReturnValue({ phase: 'budding' });
    const output = renderToJson();
    // t() is an identity function in the mock, so the raw key must appear in output
    expect(output).toContain('season.budding');
    // Hardcoded English equivalents must NOT be present
    expect(output).not.toContain('"Budding"');
    expect(output).not.toContain('"Peak"');
  });
});

describe('SeasonPhaseIndicator – petal active/inactive counts', () => {
  // Match only backgroundColor entries, not borderColor or other style properties,
  // to avoid false positives from the container's borderColor using the same #e8e6e1 value.
  const BG_ACTIVE = '"backgroundColor":"#9fb69f"';
  const BG_INACTIVE = '"backgroundColor":"#e8e6e1"';

  function countOccurrences(str: string, sub: string): number {
    let count = 0;
    let pos = str.indexOf(sub);
    while (pos !== -1) {
      count++;
      pos = str.indexOf(sub, pos + 1);
    }
    return count;
  }

  it('budding shows 1 active petal and 2 inactive petals', () => {
    (getSeasonPhase as jest.Mock).mockReturnValue({ phase: 'budding' });
    const output = renderToJson();
    expect(countOccurrences(output, BG_ACTIVE)).toBe(1);
    expect(countOccurrences(output, BG_INACTIVE)).toBe(2);
  });

  it('peak shows 2 active petals and 1 inactive petal', () => {
    (getSeasonPhase as jest.Mock).mockReturnValue({ phase: 'peak' });
    const output = renderToJson();
    expect(countOccurrences(output, BG_ACTIVE)).toBe(2);
    expect(countOccurrences(output, BG_INACTIVE)).toBe(1);
  });

  it('falling shows 3 active petals and 0 inactive petals', () => {
    (getSeasonPhase as jest.Mock).mockReturnValue({ phase: 'falling' });
    const output = renderToJson();
    expect(countOccurrences(output, BG_ACTIVE)).toBe(3);
    expect(countOccurrences(output, BG_INACTIVE)).toBe(0);
  });
});
