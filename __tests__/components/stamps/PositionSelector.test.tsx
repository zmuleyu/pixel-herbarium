/**
 * PositionSelector component tests.
 * Uses shallowRender helper (ts-jest / node env, no fiber dispatcher).
 */

import React from 'react';

jest.mock('@/constants/theme', () => ({
  stamp: {
    opacity: { pixel: 0.93, seal: 0.90, minimal: 1 },
    sealDiameter: 72,
    sealBorder: 2.5,
    minimalBarWidth: 2.5,
    pixelBorder: 2,
    padding: 16,
    defaultPosition: 'bottom-right',
    defaultStyle: 'pixel',
    storageKey: 'stamp_style_preference',
    positionStorageKey: 'stamp_position_preference',
  },
  colors: {
    border: '#ddd',
  },
  spacing: { sm: 8 },
}));

import { PositionSelector } from '@/components/stamps/PositionSelector';
import type { StampPosition } from '@/types/hanami';

// ── Recursive render helper ──────────────────────────────────────────

function shallowRender(element: any, depth = 15): any {
  if (element == null || typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') {
    return element;
  }
  if (Array.isArray(element)) {
    return element.map((e) => shallowRender(e, depth));
  }
  if (!element.type) return element;

  if (typeof element.type === 'function' && depth > 0) {
    try {
      const output = element.type({ ...element.props });
      return shallowRender(output, depth - 1);
    } catch {
      return null;
    }
  }

  const children = element.props?.children;
  return {
    type: typeof element.type === 'string' ? element.type : (element.type?.name ?? element.type?.displayName ?? 'Unknown'),
    props: { ...element.props, children: undefined },
    children: children != null ? shallowRender(children, depth) : undefined,
  };
}

function renderTree(selected: StampPosition, onSelect = jest.fn()) {
  const element = React.createElement(PositionSelector, {
    selected,
    onSelect,
    themeColor: '#e8a5b0',
  });
  return shallowRender(element);
}

function renderToJson(selected: StampPosition, onSelect = jest.fn()): string {
  return JSON.stringify(renderTree(selected, onSelect));
}

// ── Helper: count cells ──────────────────────────────────────────────

function countCells(tree: any): number {
  if (tree == null) return 0;
  if (Array.isArray(tree)) return tree.reduce((sum: number, c: any) => sum + countCells(c), 0);

  let count = 0;
  // A cell has accessibilityRole: 'button'
  if (tree.props?.accessibilityRole === 'button') count++;
  if (tree.children) count += countCells(tree.children);
  return count;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('PositionSelector', () => {
  it('renders 3x3 grid (9 cells)', () => {
    const tree = renderTree('bottom-right');
    const cells = countCells(tree);
    expect(cells).toBe(9);
  });

  it('highlights selected position', () => {
    const output = renderToJson('top-left');
    // The selected cell should contain the themeColor as backgroundColor
    expect(output).toContain('#e8a5b0');
    // Accessibility label includes 選択中 for the active cell
    expect(output).toContain('選択中');
  });

  it('renders position label in thumbnail', () => {
    const output = renderToJson('center');
    expect(output).toContain('中央');
  });

  it('default position bottom-right renders correctly', () => {
    const output = renderToJson('bottom-right');
    expect(output).toContain('右下');
  });
});
