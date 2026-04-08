import type {
  FurnitureItem,
  ItemDraft,
  ItemValidationResult,
  LayoutRecord,
  PlannerStorageData,
} from '../types/planner';

const COLOR_PATTERN =
  /^(#[0-9a-f]{3,8}|rgb(a)?\([\d\s%,.]+\)|hsl(a)?\([\d\s%,.]+\)|[a-z]+)$/i;

export const validateItemDraft = (draft: ItemDraft): ItemValidationResult => {
  const errors: ItemValidationResult['errors'] = {};

  if (draft.label.trim().length > 80) {
    errors.label = 'Label must be 80 characters or fewer.';
  }

  const width = Number(draft.widthCm);
  const height = Number(draft.heightCm);

  if (!Number.isFinite(width) || width <= 0) {
    errors.widthCm = 'Width must be a number greater than 0.';
  }

  if (!Number.isFinite(height) || height <= 0) {
    errors.heightCm = 'Height must be a number greater than 0.';
  }

  if (!COLOR_PATTERN.test(draft.color.trim())) {
    errors.color = 'Enter a valid CSS color or hex value.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const isFurnitureItem = (value: unknown): value is FurnitureItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as FurnitureItem;
  return (
    typeof item.id === 'string' &&
    typeof item.label === 'string' &&
    typeof item.widthCm === 'number' &&
    item.widthCm > 0 &&
    typeof item.heightCm === 'number' &&
    item.heightCm > 0 &&
    typeof item.color === 'string' &&
    typeof item.xCm === 'number' &&
    typeof item.yCm === 'number' &&
    [0, 90, 180, 270].includes(item.rotation)
  );
};

export const isLayoutRecord = (value: unknown): value is LayoutRecord => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const layout = value as LayoutRecord;
  return (
    typeof layout.id === 'string' &&
    typeof layout.name === 'string' &&
    typeof layout.updatedAt === 'string' &&
    Array.isArray(layout.items) &&
    layout.items.every(isFurnitureItem)
  );
};

export const isPlannerStorageData = (value: unknown): value is PlannerStorageData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as PlannerStorageData;
  return (
    data.version === 1 &&
    (typeof data.activeLayoutId === 'string' || data.activeLayoutId === null) &&
    Array.isArray(data.layouts) &&
    data.layouts.every(isLayoutRecord)
  );
};
