export const GRID_CELL_CM = 25;
export const PIXELS_PER_GRID_CELL = 20;
export const PIXELS_PER_CM = PIXELS_PER_GRID_CELL / GRID_CELL_CM;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.5;

export const cmToPx = (cm: number) => cm * PIXELS_PER_CM;
export const pxToCm = (px: number) => px / PIXELS_PER_CM;

export const clampZoom = (zoom: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(zoom.toFixed(2))));

export const snapCmToGrid = (cm: number) =>
  Math.round(cm / GRID_CELL_CM) * GRID_CELL_CM;
