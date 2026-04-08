# Apartment Layout Planner

Mobile-first apartment layout planner for placing simple rectangular furniture on a coded apartment floor plan. The app stores all measurements in centimeters, aligns its visual grid to 25 cm cells, and keeps saved layouts locally in the browser.

## Stack

- React
- TypeScript
- Vite
- react-konva
- localStorage persistence behind a storage module
- Vitest for lightweight helper tests

## Local Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy On Render

Create a new Static Site on Render with:

- Build command: `npm install && npm run build`
- Publish directory: `dist`

No backend or environment variables are required.

## Floor Plan Data

The floor-plan source of truth lives in [floorPlan.ts](C:/repos/apartment-visualiser/src/data/floorPlan.ts).

- Geometry is defined in grid units and converted to centimeters in one place.
- `floorPlanWalls` are the structural lines.
- `floorPlanGuides` are non-structural dashed strokes for door/opening hints.
- `floorPlanLabels` hold room-name anchors.
- `floorPlanBoundsCm` defines the planner extent.

If you want to adjust the apartment, edit the grid coordinates there rather than changing UI components.

## Scale

- `25 cm` real-world = `1 planner grid cell`
- `25 cm` = `20 px` on screen
- `1 cm` = `0.8 px`

Shared scale helpers live in [scale.ts](C:/repos/apartment-visualiser/src/utils/scale.ts).

## Persistence

Layouts are stored in browser `localStorage` via [plannerStorage.ts](C:/repos/apartment-visualiser/src/storage/plannerStorage.ts).

- Multiple named layouts are supported.
- The last active layout is restored automatically.
- Export/import uses versioned JSON.
- Data stays on that browser/device only.
- Layouts may be lost if the user clears site data or browser storage.

## Assumptions From The Sketch

- The current plan follows the user-provided grid reconstruction rather than the earlier inferred room rectangles.
- Bounds feedback currently uses the reconstructed outer extent, while visible walls/guides come directly from the grid geometry.
- Internal openings marked by short slanted lines are represented as guide strokes, not exact architectural door objects.

## Tests

```bash
npm test
```

Covered areas:

- scale conversion helpers
- item validation
- planner storage serialization/parsing
- basic geometry helpers
