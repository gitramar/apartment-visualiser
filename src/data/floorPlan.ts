export const CM_PER_GRID = 25;

export interface WallSegmentCm {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GuideSegmentCm {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RoomLabelCm {
  id: string;
  name: string;
  x: number;
  y: number;
}

const g = (gridUnits: number, offsetCm = 0) => gridUnits * CM_PER_GRID + offsetCm;

export const floorPlanWalls: WallSegmentCm[] = [
  { id: "tl_top", x1: g(0), y1: g(0), x2: g(20, 8), y2: g(0) },
  { id: "tl_left_outer", x1: g(0), y1: g(0), x2: g(0), y2: g(7, 18) },
  { id: "tl_notch", x1: g(0), y1: g(7, 18), x2: g(1, 20), y2: g(7, 18) },
  { id: "tl_left_inner", x1: g(1, 20), y1: g(7, 18), x2: g(1, 20), y2: g(14, -2) },
  { id: "center_divider", x1: g(20, 8), y1: g(0), x2: g(20, 8), y2: g(13, 20) },
  { id: "tr_top", x1: g(20, 8), y1: g(0), x2: g(37, 5), y2: g(0) },
  { id: "tr_right_outer", x1: g(37, 5), y1: g(0), x2: g(37, 5), y2: g(23, 2) },
  { id: "tr_lower_horizontal", x1: g(29, -5), y1: g(10, 20), x2: g(37, 5), y2: g(10, 20) },
  { id: "ll_top", x1: g(0), y1: g(14, -2), x2: g(15, 6), y2: g(14, -2) },
  { id: "ll_left", x1: g(0), y1: g(14, -2), x2: g(0), y2: g(21, 18) },
  { id: "ll_bottom", x1: g(0), y1: g(21, 18), x2: g(12, 18), y2: g(21, 18) },
  { id: "ll_right_lower", x1: g(12, 18), y1: g(17, 12), x2: g(12, 18), y2: g(21, 18) },
  { id: "center_stub_left", x1: g(18, 0), y1: g(13, 20), x2: g(20, 14), y2: g(13, 20) },
  { id: "mr_top", x1: g(23, 18), y1: g(10, 20), x2: g(37, 5), y2: g(10, 20) },
  { id: "mr_box_left", x1: g(23, 18), y1: g(10, 20), x2: g(23, 18), y2: g(15, 8) },
  { id: "mr_box_bottom", x1: g(23, 18), y1: g(15, 8), x2: g(29, -2), y2: g(15, 8) },
  { id: "mr_box_right", x1: g(29, -2), y1: g(10, 22), x2: g(29, -2), y2: g(15, 8) },
  { id: "approach_line_left", x1: g(13, -5), y1: g(20, 12), x2: g(19, 10), y2: g(20, 12) },
  { id: "lc_box_left", x1: g(17, 22), y1: g(20, 12), x2: g(17, 22), y2: g(23, 2) },
  { id: "lc_box_top_left", x1: g(17, 22), y1: g(20, 12), x2: g(20, 10), y2: g(20, 12) },
  { id: "lc_box_top_right", x1: g(22, 16), y1: g(20, 12), x2: g(23, -5), y2: g(20, 12) },
  { id: "lc_box_bottom", x1: g(17, 22), y1: g(23, 2), x2: g(23, -5), y2: g(23, 2) },
  { id: "lc_box_right", x1: g(23, -5), y1: g(20, 12), x2: g(23, -5), y2: g(23, 2) },
  { id: "br_top", x1: g(23, -5), y1: g(19, 0), x2: g(37, 5), y2: g(19, 0) },
  { id: "br_left", x1: g(23, -5), y1: g(19, 0), x2: g(23, -5), y2: g(23, 2) },
  { id: "br_bottom", x1: g(23, -5), y1: g(23, 2), x2: g(37, 5), y2: g(23, 2) },
  { id: "br_right", x1: g(37, 5), y1: g(19, 0), x2: g(37, 5), y2: g(23, 2) },
  { id: "br_partition", x1: g(34, -8), y1: g(19, 0), x2: g(34, -8), y2: g(23, 2) },
];

export const floorPlanGuides: GuideSegmentCm[] = [];

export const floorPlanLabels: RoomLabelCm[] = [
  { id: "label_left_large", name: "Large Room", x: g(8), y: g(4, 10) },
  { id: "label_right_large", name: "Large Room", x: g(29), y: g(4, 10) },
  { id: "label_lower_left", name: "Room", x: g(5), y: g(17, 10) },
  { id: "label_mid_right", name: "Inset Room", x: g(26), y: g(12, 20) },
  { id: "label_lower_right", name: "Long Room", x: g(28), y: g(20, 10) },
];

export const floorPlanBoundsCm = {
  width: g(37, 5),
  height: g(23, 2),
};

export const floorPlanDebug = {
  cmPerGrid: CM_PER_GRID,
  notes: [
    "This version intentionally uses off-grid centimeter offsets.",
    "It is based on visual matching to the sketch, not strict snapping.",
    "If more tuning is needed, adjust this file rather than rendered pixel values.",
  ],
};
