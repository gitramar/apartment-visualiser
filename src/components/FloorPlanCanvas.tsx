import { useRef } from 'react';
import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { FurnitureItem, GuideSegment, WallSegment } from '../types/planner';
import { clampZoom, cmToPx, GRID_CELL_CM, PIXELS_PER_GRID_CELL, pxToCm } from '../utils/scale';
import { getItemFootprint } from '../utils/geometry';

interface FloorPlanCanvasProps {
  boundsCm: { width: number; height: number };
  wallSegments: WallSegment[];
  guideSegments: GuideSegment[];
  items: FurnitureItem[];
  selectedItemId: string | null;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  pan: { x: number; y: number };
  isFullscreen: boolean;
  pendingPlacement: { label: string; widthCm: string; heightCm: string; color: string } | null;
  itemWarnings: { outOfBounds: Set<string>; overlaps: Set<string> };
  onSelectItem: (itemId: string | null) => void;
  onMoveItem: (itemId: string, xCm: number, yCm: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onPlaceItem: (xCm: number, yCm: number) => void;
}

export function FloorPlanCanvas({
  boundsCm,
  wallSegments,
  guideSegments,
  items,
  selectedItemId,
  viewportWidth,
  viewportHeight,
  zoom,
  pan,
  isFullscreen,
  pendingPlacement,
  itemWarnings,
  onSelectItem,
  onMoveItem,
  onPanChange,
  onZoomChange,
  onPlaceItem,
}: FloorPlanCanvasProps) {
  const stageRef = useRef<import('konva/lib/Stage').Stage | null>(null);
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const planWidthPx = cmToPx(boundsCm.width);
  const planHeightPx = cmToPx(boundsCm.height);
  const isMobileViewport = viewportWidth < 900;
  const stageWidth = isFullscreen
    ? viewportWidth
    : viewportWidth > 1024
      ? Math.min(viewportWidth - 420, 1100)
      : Math.max(296, viewportWidth - 48);
  const stageHeight = isFullscreen ? viewportHeight : isMobileViewport ? 380 : 520;

  const handleBackgroundClick = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if ('touches' in event.evt && event.evt.touches.length > 1) {
      return;
    }

    const stage = event.target.getStage();
    if (!stage) {
      return;
    }

    if (event.target !== stage) {
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return;
    }

    const x = pxToCm((pointer.x - stage.x()) / stage.scaleX());
    const y = pxToCm((pointer.y - stage.y()) / stage.scaleY());

    if (pendingPlacement) {
      onPlaceItem(x, y);
      return;
    }

    onSelectItem(null);
  };

  const handleTouchMove = (event: KonvaEventObject<TouchEvent>) => {
    const stage = event.target.getStage();
    const touches = event.evt.touches;
    if (!stage || touches.length !== 2) {
      return;
    }

    event.evt.preventDefault();

    if (stage.isDragging()) {
      stage.stopDrag();
    }

    const first = touches[0];
    const second = touches[1];
    if (!first || !second) {
      return;
    }

    const center = {
      x: (first.clientX + second.clientX) / 2,
      y: (first.clientY + second.clientY) / 2,
    };
    const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);

    if (!lastPinchCenterRef.current || !lastPinchDistanceRef.current) {
      lastPinchCenterRef.current = center;
      lastPinchDistanceRef.current = distance;
      return;
    }

    const pointTo = {
      x: (center.x - pan.x) / zoom,
      y: (center.y - pan.y) / zoom,
    };
    const nextZoom = clampZoom((zoom * distance) / lastPinchDistanceRef.current);
    const nextPan = {
      x: center.x - pointTo.x * nextZoom,
      y: center.y - pointTo.y * nextZoom,
    };

    onZoomChange(nextZoom);
    onPanChange(nextPan);
    lastPinchCenterRef.current = center;
    lastPinchDistanceRef.current = distance;
  };

  const handleTouchEnd = () => {
    lastPinchCenterRef.current = null;
    lastPinchDistanceRef.current = null;
  };

  return (
    <div className="canvasShell">
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        draggable={!pendingPlacement}
        onDragEnd={(event) => onPanChange({ x: event.target.x(), y: event.target.y() })}
        onMouseDown={handleBackgroundClick}
        onTouchStart={handleBackgroundClick}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={planWidthPx}
            height={planHeightPx}
            fill="#11161b"
            cornerRadius={12}
            listening={false}
          />

          {Array.from({ length: Math.ceil(boundsCm.width / GRID_CELL_CM) + 1 }).map((_, index) => {
            const x = index * PIXELS_PER_GRID_CELL;
            const isMeter = index % 4 === 0;
            return (
              <Line
                key={`vx-${index}`}
                points={[x, 0, x, planHeightPx]}
                stroke={isMeter ? '#3f4952' : '#232c34'}
                strokeWidth={isMeter ? 1.5 : 0.75}
                listening={false}
              />
            );
          })}

          {Array.from({ length: Math.ceil(boundsCm.height / GRID_CELL_CM) + 1 }).map((_, index) => {
            const y = index * PIXELS_PER_GRID_CELL;
            const isMeter = index % 4 === 0;
            return (
              <Line
                key={`hy-${index}`}
                points={[0, y, planWidthPx, y]}
                stroke={isMeter ? '#3f4952' : '#232c34'}
                strokeWidth={isMeter ? 1.5 : 0.75}
                listening={false}
              />
            );
          })}

          {wallSegments.map((segment) => (
            <Line
              key={segment.id}
              points={[
                cmToPx(segment.x1),
                cmToPx(segment.y1),
                cmToPx(segment.x2),
                cmToPx(segment.y2),
              ]}
              stroke="#f3f1eb"
              strokeWidth={4}
              lineCap="square"
              listening={false}
            />
          ))}

          {guideSegments.map((segment) => (
            <Line
              key={segment.id}
              points={[
                cmToPx(segment.x1),
                cmToPx(segment.y1),
                cmToPx(segment.x2),
                cmToPx(segment.y2),
              ]}
              stroke="#7a90b2"
              strokeWidth={3}
              dash={[8, 6]}
              listening={false}
            />
          ))}

          {items.map((item) => {
            const footprint = getItemFootprint(item);
            const x = cmToPx(item.xCm);
            const y = cmToPx(item.yCm);
            const width = cmToPx(footprint.widthCm);
            const height = cmToPx(footprint.heightCm);
            const selected = item.id === selectedItemId;
            const warning = itemWarnings.outOfBounds.has(item.id) || itemWarnings.overlaps.has(item.id);

            return (
              <Group
                key={item.id}
                draggable={!item.locked && !pendingPlacement}
                onClick={() => {
                  if (!pendingPlacement) {
                    onSelectItem(item.id);
                  }
                }}
                onTap={() => {
                  if (!pendingPlacement) {
                    onSelectItem(item.id);
                  }
                }}
                onDragStart={(event) => {
                  event.cancelBubble = true;
                  if (stageRef.current) {
                    stageRef.current.stopDrag();
                    stageRef.current.draggable(false);
                  }
                }}
                onDragMove={(event) => {
                  event.cancelBubble = true;
                }}
                onDragEnd={(event) => {
                  if (stageRef.current) {
                    stageRef.current.draggable(!pendingPlacement);
                  }
                  onMoveItem(item.id, pxToCm(event.target.x()), pxToCm(event.target.y()));
                }}
                x={x}
                y={y}
              >
                <Rect
                  width={width}
                  height={height}
                  fill={item.color}
                  opacity={item.locked ? 0.65 : 0.9}
                  stroke={selected ? '#82d6ae' : warning ? '#ff6b6b' : '#101418'}
                  strokeWidth={selected ? 4 : 2}
                  cornerRadius={6}
                />
                {width > 60 && height > 24 ? (
                  <Text
                    text={item.label}
                    width={width}
                    height={height}
                    align="center"
                    verticalAlign="middle"
                    fill="#0f0f0f"
                    fontSize={14}
                    padding={6}
                    listening={false}
                  />
                ) : null}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
