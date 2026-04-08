import type { LayoutImportResult, LayoutRecord, PlannerStorageData } from '../types/planner';
import { isPlannerStorageData } from '../utils/validation';
import { makeId } from '../utils/id';

const STORAGE_KEY = 'apartment-layout-planner:v1';

export const createEmptyLayout = (name = 'My Layout'): LayoutRecord => ({
  id: makeId('layout'),
  name,
  updatedAt: new Date().toISOString(),
  items: [],
});

export const createDefaultStorageData = (): PlannerStorageData => {
  const defaultLayout = createEmptyLayout('Move Plan');
  return {
    version: 1,
    activeLayoutId: defaultLayout.id,
    layouts: [defaultLayout],
  };
};

export const serializePlannerData = (data: PlannerStorageData) =>
  JSON.stringify(data, null, 2);

export const parsePlannerData = (raw: string): LayoutImportResult => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isPlannerStorageData(parsed)) {
      return { ok: false, error: 'Invalid planner JSON structure.' };
    }

    return { ok: true, data: parsed };
  } catch {
    return { ok: false, error: 'Could not parse JSON.' };
  }
};

export const loadPlannerData = (): PlannerStorageData => {
  if (typeof window === 'undefined') {
    return createDefaultStorageData();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultStorageData();
    }

    const parsed = parsePlannerData(raw);
    return parsed.ok && parsed.data ? parsed.data : createDefaultStorageData();
  } catch {
    return createDefaultStorageData();
  }
};

export const savePlannerData = (data: PlannerStorageData) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, serializePlannerData(data));
  } catch {
    // Ignore storage failures and let the app continue in-memory.
  }
};

export const exportPlannerData = (data: PlannerStorageData) => {
  const blob = new Blob([serializePlannerData(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `apartment-layouts-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const getStorageKey = () => STORAGE_KEY;
