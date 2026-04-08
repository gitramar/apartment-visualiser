import { describe, expect, it } from 'vitest';
import {
  recenterPan,
  resolveRingMenuHighlight,
  toggleMobilePanel,
} from '../utils/mobileInteractions';
import type { ItemDraft } from '../types/planner';

const presets: ItemDraft[] = [
  { label: 'Sofa', widthCm: '220', heightCm: '95', color: '#5f8f6e' },
  { label: 'Bed', widthCm: '180', heightCm: '200', color: '#7897c0' },
  { label: 'Table', widthCm: '160', heightCm: '90', color: '#8c6a43' },
];

describe('toggleMobilePanel', () => {
  it('toggles panels open and closed', () => {
    expect(toggleMobilePanel(null, 'items', false)).toBe('items');
    expect(toggleMobilePanel('items', 'items', false)).toBeNull();
  });

  it('does not open edit when nothing is selected', () => {
    expect(toggleMobilePanel(null, 'edit', false)).toBeNull();
    expect(toggleMobilePanel('items', 'edit', false)).toBe('items');
  });
});

describe('recenterPan', () => {
  it('moves pan by the offset between pressed and centered points', () => {
    expect(recenterPan({ x: 20, y: 30 }, { x: 100, y: 100 }, { x: 150, y: 80 })).toEqual({
      x: 70,
      y: 10,
    });
  });
});

describe('resolveRingMenuHighlight', () => {
  it('returns null inside the dead zone', () => {
    expect(resolveRingMenuHighlight({ x: 100, y: 100 }, { x: 100, y: 100 }, presets)).toBeNull();
  });

  it('returns the nearest preset when inside hit range', () => {
    const result = resolveRingMenuHighlight({ x: 100, y: 8 }, { x: 100, y: 100 }, presets);
    expect(result?.label).toBe('Sofa');
  });

  it('returns null when outside the active ring', () => {
    expect(resolveRingMenuHighlight({ x: 100, y: -100 }, { x: 100, y: 100 }, presets)).toBeNull();
  });
});
