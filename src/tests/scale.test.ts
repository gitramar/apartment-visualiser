import { clampZoom, cmToPx, pxToCm, snapCmToGrid } from '../utils/scale';

describe('scale helpers', () => {
  it('converts centimeters to pixels and back', () => {
    expect(cmToPx(25)).toBe(20);
    expect(pxToCm(80)).toBe(100);
  });

  it('snaps to the 25 cm grid', () => {
    expect(snapCmToGrid(63)).toBe(75);
    expect(snapCmToGrid(36)).toBe(25);
  });

  it('clamps zoom levels', () => {
    expect(clampZoom(10)).toBe(2.5);
    expect(clampZoom(0.1)).toBe(0.5);
  });
});
