# Apartment Layout Planner – Build Spec

## Goal
Build a small web app that helps a user plan furniture placement for an apartment move.

The app should let the user:
- define rectangular furniture/items by entering **width**, **height**, **color**, and **label**
- automatically render those items as **movable shapes** on a scaled apartment floor plan
- use a **1:50 scale** so the layout roughly matches real-world dimensions
- save and reload multiple layouts
- work well on **mobile phones first**, especially modern smartphone browsers

The primary deployment target is a mobile browser, with layout data stored on the phone itself.
The app will be hosted on **Render**.

---

## Core Use Case
The user has a rough apartment floor plan and wants to recreate it digitally.
They should be able to:
1. define the apartment walls/rooms
2. create furniture blocks from measurements
3. drag, rotate, and position those blocks inside the floor plan
4. compare furniture size relative to the apartment
5. save the layout and come back later

This is not a full CAD tool. It should feel lightweight, fast, and easy.

---

## Source Material / Context
A hand-drawn apartment sketch exists with a **1:50 scale** reference.
The rough furniture examples in the sketch include things like:
- sofa
- TV / media furniture
- table / side tables
- bed
- smaller storage pieces

The app should not depend on image recognition from the sketch at runtime.
Instead, hardcode the apartment floor plan from a configuration object.

---

## Product Scope

### In scope
- Single-page web app
- Mobile-first responsive UI
- Floor plan drawn in-browser
- Add custom rectangular items
- Move items by drag-and-drop
- Rotate items in 90° steps
- Edit item dimensions and color
- Delete items
- Save/load **multiple named layouts** locally on the device
- Basic collision / bounds feedback
- Optional item labels
- Scale/grid support based on 1:50

### Out of scope
- Full architectural accuracy tools
- Arbitrary polygon furniture editing
- Multi-user collaboration
- Backend database
- Authentication
- Image-to-floor-plan parsing
- Mobile-first optimization

---

## Recommended Tech Stack
Use a stack that is simple to host on Render and easy for Codex to generate cleanly.

### Preferred
- **React + TypeScript + Vite**
- **CSS Modules** or simple scoped CSS
- **Konva / react-konva** for drawing and dragging on a canvas-like stage
- **Zustand** or React state for app state
- **LocalStorage** for persistence

### Why
This app is interactive and shape-based. A canvas layer library like Konva is a better fit than manually positioning divs.

If Codex prefers another equivalent browser-safe stack, that is acceptable, but React + TypeScript is the default target.

---

## Scale Rules
The apartment sketch uses **1:50 scale** and is drawn on graph paper where each grid square is **0.5 cm** on paper.

### Real-world meaning of the paper grid
At 1:50 scale:
- **0.5 cm on paper = 25 cm in reality**
- therefore **each grid square = 25 cm real-world**
- **2 grid squares = 50 cm real-world**
- **4 grid squares = 100 cm = 1 meter real-world**

### Internal units
The app should internally store dimensions in **centimeters**.

### Recommended display conversion
Use a fixed conversion such as:
- **25 cm real-world = 20 pixels on screen**
- therefore **1 grid square = 20 pixels**
- therefore **1 cm = 0.8 pixels**

This keeps the digital grid easy to reason about because one paper square maps cleanly to one app grid cell.

### Requirement
All room and furniture dimensions should be stored in real units (cm), then converted to pixels using a shared scale constant.

Example:
```ts
const GRID_CELL_CM = 25;
const PIXELS_PER_GRID_CELL = 20;
const PIXELS_PER_CM = PIXELS_PER_GRID_CELL / GRID_CELL_CM; // 0.8
const px = cm * PIXELS_PER_CM;
```

Provide shared constants so scale can be tuned later.

---

## Floor Plan Model
The apartment itself should be defined in code, not manually drawn by the user.
Use a configuration object describing:
- wall segments
- door openings
- room areas if useful
- optional labels

### Suggested shape model
```ts
interface WallSegment {
  id: string;
  x1: number; // cm
  y1: number; // cm
  x2: number; // cm
  y2: number; // cm
}

interface DoorOpening {
  id: string;
  x: number; // cm
  y: number; // cm
  width: number; // cm
  orientation: 'horizontal' | 'vertical';
}
```

### Requirement
Codex should implement the floor plan from a constant file such as:
- `src/data/floorPlan.ts`

This makes it easy to adjust later.

---

## Furniture / Item Model
Users should be able to create simple rectangular pieces.

### Data model
```ts
interface FurnitureItem {
  id: string;
  label: string;
  widthCm: number;
  heightCm: number;
  color: string;
  xCm: number;
  yCm: number;
  rotation: 0 | 90 | 180 | 270;
  locked?: boolean;
}
```

### Notes
- `widthCm` and `heightCm` are real dimensions
- `xCm` and `yCm` are top-left origin positions in plan space
- rotation is enough in 90-degree increments for this use case
- locked items cannot be dragged accidentally

---

## UI Requirements

### Platform priority
This app should be designed **mobile-first**.
Desktop support is welcome, but the UX should primarily target a user working from a phone.

### Mobile UX goals
- large touch-friendly controls
- no tiny drag handles
- readable form fields without zooming
- bottom sheet, tabs, or stacked panels instead of a dense desktop sidebar
- canvas area should support pan/zoom gestures or explicit zoom buttons
- avoid hover-only interactions entirely

### Suggested layout

#### On mobile
Use a layout with:
- top app bar with project/layout name
- main floor plan canvas in the center
- collapsible bottom panel or tabbed controls for:
  - add item
  - selected item editor
  - saved layouts
  - app actions

#### On desktop
A two-panel layout is acceptable, but mobile behavior takes priority.

---

## Functional Requirements

### 1. Add furniture/items
The sidebar should have a form with:
- label
- width (cm)
- height (cm)
- color picker
- button: **Add item**

Validation:
- width and height must be positive numbers
- color must be a valid CSS color string or hex
- label can be optional, but default to something like `Item 1`

When submitted:
- create a new rectangle
- place it at a default position near the top-left of the usable area
- add it to the item list

---

### 2. Render items on the plan
Each item should appear as a colored rectangle with:
- outline
- optional centered label
- selection highlight when clicked

The rectangle size must be calculated from real-world size using the scale constant.

---

### 3. Drag and drop
The user should be able to drag items around the plan using touch or mouse.

Requirements:
- dragging updates `xCm` and `yCm`
- movement should feel smooth on mobile devices
- touch interaction must be reliable and not depend on tiny hit areas
- dragging outside the floor plan should be prevented or visually flagged
- snapping to grid is a plus, but not required for v1

Pan/zoom must not interfere badly with item dragging. Codex should handle interaction state carefully.

---

### 4. Rotate items
Each selected item should have a **Rotate 90°** action.

Requirements:
- width/height display should visually rotate correctly
- underlying stored dimensions remain the same; rendering handles rotation
- rotation origin should be stable and not feel broken

---

### 5. Edit selected item
When an item is selected, show an edit form with:
- label
- width
- height
- color
- x/y position
- lock toggle
- rotate button
- delete button

Changing width/height should immediately resize the rectangle.

---

### 6. Save/load
Persist app state to browser storage on the phone.

### Storage target
Use **localStorage** for v1 unless Codex strongly prefers **IndexedDB** for managing multiple layouts more cleanly.

The key requirement is:
- layouts must be stored **locally on the phone**
- the user must be able to create and reopen multiple saved layouts later on the same device
- no backend is required for storage

### Required save/load features
- save current furniture layout automatically on change
- support **multiple named layouts**
- allow creating a new layout
- allow renaming a layout
- allow duplicating a layout
- allow deleting a layout
- restore the last-opened layout automatically on app load
- include **Export JSON** and **Import JSON** options for backup or moving data to another device

### Suggested local data model
```json
{
  "version": 1,
  "activeLayoutId": "layout-123",
  "layouts": [
    {
      "id": "layout-123",
      "name": "Living room test",
      "updatedAt": "2026-04-07T12:00:00.000Z",
      "items": []
    }
  ]
}
```

If localStorage size becomes awkward, Codex may switch persistence to IndexedDB, but the external behavior should stay the same.

---

### 7. Collision / bounds feedback
For v1, collision does not need to block placement, but the app should provide feedback.

Requirements:
- if an item overlaps apartment walls or exits valid area, show a warning style
- if items overlap each other, optional warning outline is enough
- do not over-engineer physics

This is a planning tool, not a game.

---

### 8. Grid and ruler hints
Show a visible background grid.

Recommended:
- light grid every 50 cm
- stronger line every 100 cm
- optional ruler labels on top/left edges

This helps make measurements easier to judge.

---

## Suggested UX Details

### Item list
Show all created items in the sidebar with:
- small color swatch
- label
- dimensions
- select button
- delete button

### Quality-of-life
Nice-to-have features:
- duplicate selected item
- bring to front / send to back
- keyboard delete for selected item
- arrow key nudging
- shift-drag or alt-drag for duplicate

These are optional after the main build is stable.

---

## Suggested App Structure
```text
src/
  components/
    FloorPlanCanvas.tsx
    Sidebar.tsx
    ItemForm.tsx
    ItemEditor.tsx
    ItemList.tsx
    Toolbar.tsx
  data/
    floorPlan.ts
  hooks/
    useLocalStorage.ts
  store/
    usePlannerStore.ts
  types/
    planner.ts
  utils/
    scale.ts
    geometry.ts
    validation.ts
  App.tsx
  main.tsx
```

---

## Geometry / Coordinate Rules
Use a single top-left origin for the whole apartment plan.
All apartment walls and furniture positions should use the same coordinate system in centimeters.

### Example
```ts
// Real-world plan space
xCm = 250;
yCm = 400;
```

Then render using conversion helpers:
```ts
export const cmToPx = (cm: number) => cm * PIXELS_PER_CM;
export const pxToCm = (px: number) => px / PIXELS_PER_CM;
```

Keep all source-of-truth state in centimeters, not pixels.
That avoids scale bugs later.

---

## Render Requirements

### Walls
- draw wall segments in dark lines
- wall thickness can be visual only
- door openings should be visible as gaps in walls

### Furniture
- filled colored rectangles
- thin border
- selected state should be obvious
- label text should scale sensibly and not overflow badly

### Background
- neutral light background
- subtle grid
- clean and readable, not decorative

---

## Initial Floor Plan Delivery Requirement
Codex should implement the floor plan in a way that is easy to edit by hand afterward.

That means:
- no hardcoded plan math spread throughout components
- all wall coordinates live in one config file
- comments explain how to tweak coordinates

The first version can approximate the hand-drawn plan rather than being architect-grade exact.
The important part is that the system is reusable and easy to refine.

---

## Validation Rules
- width/height must be numbers > 0
- x/y must remain within a reasonable range
- imported JSON must be validated before use
- invalid input should show a clear inline error message

Do not let the app crash from bad input.

---

## Persistence Format
Use a versioned JSON structure that supports multiple saved layouts.

```json
{
  "version": 1,
  "activeLayoutId": "layout-123",
  "layouts": [
    {
      "id": "layout-123",
      "name": "My layout",
      "updatedAt": "2026-04-07T12:00:00.000Z",
      "items": []
    }
  ]
}
```

The persistence layer should be abstracted behind a small storage module so it can later move from localStorage to IndexedDB without affecting the rest of the app.

---

## Error Handling
- localStorage read failures should fall back gracefully
- malformed import JSON should show an error
- render failures from bad item values should be guarded against

---

## Deployment Requirements
The app should:
- build with a standard production build command
- run as a static frontend on Render
- not require a backend
- behave well when opened from a mobile browser on Android or iPhone

Because storage is local to the browser, saved layouts will remain on that device/browser unless the user clears site data.
The README should explain that clearly.

### Expected scripts
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview"
}
```

Provide a minimal Render deployment note in the README.

---

## README Requirements
Codex should generate a README that includes:
- project purpose
- local setup
- build instructions
- deployment on Render
- where to edit the floor plan
- how scale works
- where saved data lives
- a clear note that layouts are stored locally in the phone browser and may be lost if browser site data is cleared
- whether the implementation uses localStorage or IndexedDB

---

## Testing Expectations
Add lightweight tests for:
- scale conversion helpers
- item validation
- localStorage serializer/deserializer
- basic geometry helper logic if implemented

Do not go overboard. Keep it practical.

---

## Acceptance Criteria
The project is complete when all of the following are true:

1. The apartment floor plan renders from a config file.
2. A user can add a rectangle by entering width, height, color, and label.
3. Added items appear on the plan at the correct scale.
4. Items can be selected, dragged, edited, rotated, and deleted.
5. The app works well on a mobile phone with touch interaction.
6. The user can manage multiple named layouts stored locally on the phone.
7. The last-opened layout persists across refresh on the same device/browser.
8. The code is organized, readable, and easy to adjust.
9. The README explains how to run and deploy it on Render and how local device storage works.

---

## Nice-to-Have After v1
These should only be added if the core version is already solid:
- resize handles on the canvas
- grid snapping toggle
- room labels
- furniture templates (bed, sofa, TV bench, dining table)
- PNG export / print layout
- door swing visualization
- measurement overlay between two points

---

## Implementation Guidance for Codex
Prioritize correctness and maintainability over visual flash.

Specific implementation guidance:
- keep state normalized and typed
- keep all dimensions in centimeters internally
- isolate scaling logic in one utility module
- isolate floor plan data in one file
- avoid magical numbers scattered across components
- keep the UI plain but polished
- produce a full working project, not partial snippets

---

## Optional Starter Furniture Presets
It would be useful to support a few optional presets in addition to manual entry:
- Bed
- Sofa
- TV Bench
- Coffee Table
- Dining Table
- Bookshelf

Each preset can prefill width/height values but still remain editable.

---

## Final Instruction
Generate the full project as a production-ready v1 implementation using the preferred stack, including:
- source code
- styling
- local persistence
- floor plan config
- README
- minimal tests

Keep the solution simple, stable, and easy to extend.

