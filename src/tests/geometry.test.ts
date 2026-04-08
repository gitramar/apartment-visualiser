import { getItemFootprint, isRectWithinBounds, rectsOverlap } from '../utils/geometry';

describe('geometry helpers', () => {
  it('swaps dimensions for 90 degree rotations', () => {
    expect(
      getItemFootprint({
        id: '1',
        label: 'Desk',
        widthCm: 50,
        heightCm: 100,
        color: '#000',
        xCm: 0,
        yCm: 0,
        rotation: 90,
      }).widthCm,
    ).toBe(100);
  });

  it('detects overlaps', () => {
    expect(
      rectsOverlap(
        { xCm: 0, yCm: 0, widthCm: 100, heightCm: 100 },
        { xCm: 90, yCm: 90, widthCm: 100, heightCm: 100 },
      ),
    ).toBe(true);
  });

  it('checks whether a rect stays inside planner bounds', () => {
    expect(isRectWithinBounds({ xCm: 25, yCm: 25, widthCm: 50, heightCm: 50 }, 200, 200)).toBe(true);
    expect(isRectWithinBounds({ xCm: 180, yCm: 180, widthCm: 50, heightCm: 50 }, 200, 200)).toBe(false);
  });
});
