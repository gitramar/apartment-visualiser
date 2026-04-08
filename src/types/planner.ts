export type Rotation = 0 | 90 | 180 | 270;

export interface FurnitureItem {
  id: string;
  label: string;
  widthCm: number;
  heightCm: number;
  color: string;
  xCm: number;
  yCm: number;
  rotation: Rotation;
  locked?: boolean;
}

export interface LayoutRecord {
  id: string;
  name: string;
  updatedAt: string;
  items: FurnitureItem[];
}

export interface PlannerStorageData {
  version: 1;
  activeLayoutId: string | null;
  layouts: LayoutRecord[];
}

export interface WallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GuideSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RoomLabel {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface FloorPlanBounds {
  width: number;
  height: number;
}

export interface FloorPlanConfig {
  id: string;
  name: string;
  cmPerGrid: number;
  wallSegments: WallSegment[];
  guideSegments: GuideSegment[];
  roomLabels: RoomLabel[];
  boundsCm: FloorPlanBounds;
  notes: string[];
}

export interface ItemDraft {
  label: string;
  widthCm: string;
  heightCm: string;
  color: string;
}

export interface ItemValidationResult {
  valid: boolean;
  errors: Partial<Record<'label' | 'widthCm' | 'heightCm' | 'color' | 'json', string>>;
}

export interface LayoutImportResult {
  ok: boolean;
  data?: PlannerStorageData;
  error?: string;
}
