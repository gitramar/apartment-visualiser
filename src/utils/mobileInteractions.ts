import type { ItemDraft } from '../types/planner';

export type MobilePanel = 'items' | 'layouts' | 'edit' | null;

export interface RingMenuConfig {
  innerRadius: number;
  outerRadius: number;
  optionRadius: number;
  hitRadius: number;
}

export const DEFAULT_RING_MENU_CONFIG: RingMenuConfig = {
  innerRadius: 48,
  outerRadius: 168,
  optionRadius: 94,
  hitRadius: 58,
};

export function toggleMobilePanel(current: MobilePanel, target: MobilePanel, hasSelection: boolean) {
  if (target === 'edit' && !hasSelection) {
    return current === 'edit' ? null : current;
  }

  return current === target ? null : target;
}

export function recenterPan(
  currentPan: { x: number; y: number },
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  return {
    x: currentPan.x + (to.x - from.x),
    y: currentPan.y + (to.y - from.y),
  };
}

export function resolveRingMenuHighlight(
  client: { x: number; y: number },
  center: { x: number; y: number },
  presets: ItemDraft[],
  config: RingMenuConfig = DEFAULT_RING_MENU_CONFIG,
): ItemDraft | null {
  const dx = client.x - center.x;
  const dy = client.y - center.y;
  const distance = Math.hypot(dx, dy);

  if (distance < config.innerRadius || distance > config.outerRadius || presets.length === 0) {
    return null;
  }

  let bestPreset: ItemDraft | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  presets.forEach((preset, index) => {
    const angle = (Math.PI * 2 * index) / presets.length - Math.PI / 2;
    const optionX = center.x + Math.cos(angle) * config.optionRadius;
    const optionY = center.y + Math.sin(angle) * config.optionRadius;
    const score = Math.hypot(client.x - optionX, client.y - optionY);

    if (score < bestScore) {
      bestScore = score;
      bestPreset = preset;
    }
  });

  return bestScore <= config.hitRadius ? bestPreset : null;
}
