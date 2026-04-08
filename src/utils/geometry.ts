import type { FurnitureItem } from '../types/planner';
import { GRID_CELL_CM } from './scale';

export interface RectCm {
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
}

export const getItemFootprint = (item: FurnitureItem): RectCm => {
  const rotated = item.rotation === 90 || item.rotation === 270;
  return {
    xCm: item.xCm,
    yCm: item.yCm,
    widthCm: rotated ? item.heightCm : item.widthCm,
    heightCm: rotated ? item.widthCm : item.heightCm,
  };
};

export const rectsOverlap = (a: RectCm, b: RectCm) =>
  a.xCm < b.xCm + b.widthCm &&
  a.xCm + a.widthCm > b.xCm &&
  a.yCm < b.yCm + b.heightCm &&
  a.yCm + a.heightCm > b.yCm;

export const isRectWithinBounds = (rect: RectCm, widthCm: number, heightCm: number) =>
  rect.xCm >= 0 &&
  rect.yCm >= 0 &&
  rect.xCm + rect.widthCm <= widthCm &&
  rect.yCm + rect.heightCm <= heightCm;

export const getItemIssues = (items: FurnitureItem[], widthCm: number, heightCm: number) => {
  const outOfBounds = new Set<string>();
  const overlaps = new Set<string>();

  items.forEach((item, index) => {
    const footprint = getItemFootprint(item);
    if (!isRectWithinBounds(footprint, widthCm, heightCm)) {
      outOfBounds.add(item.id);
    }

    for (let otherIndex = index + 1; otherIndex < items.length; otherIndex += 1) {
      const other = items[otherIndex];
      if (rectsOverlap(footprint, getItemFootprint(other))) {
        overlaps.add(item.id);
        overlaps.add(other.id);
      }
    }
  });

  return { outOfBounds, overlaps };
};

export const clampRectToBounds = (rect: RectCm, widthCm: number, heightCm: number): RectCm => ({
  ...rect,
  xCm: Math.max(0, Math.min(rect.xCm, Math.max(0, widthCm - rect.widthCm))),
  yCm: Math.max(0, Math.min(rect.yCm, Math.max(0, heightCm - rect.heightCm))),
});

export const sampleRectGridPoints = (rect: RectCm, stepCm: number = GRID_CELL_CM) => {
  const points: Array<{ xCm: number; yCm: number }> = [];
  const maxX = rect.xCm + rect.widthCm;
  const maxY = rect.yCm + rect.heightCm;

  for (let x = rect.xCm; x <= maxX; x += stepCm) {
    for (let y = rect.yCm; y <= maxY; y += stepCm) {
      points.push({ xCm: Math.min(x, maxX), yCm: Math.min(y, maxY) });
    }
  }

  return points;
};
