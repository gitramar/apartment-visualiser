import { useEffect, useMemo, useState } from 'react';
import { FloorPlanCanvas } from './components/FloorPlanCanvas';
import { ItemEditor } from './components/ItemEditor';
import { ItemForm } from './components/ItemForm';
import { ItemList } from './components/ItemList';
import { LayoutManager } from './components/LayoutManager';
import { CM_PER_GRID, floorPlanBoundsCm, floorPlanDebug, floorPlanGuides, floorPlanWalls } from './data/floorPlan';
import {
  createDefaultStorageData,
  createEmptyLayout,
  exportPlannerData,
  loadPlannerData,
  parsePlannerData,
  savePlannerData,
} from './storage/plannerStorage';
import type { FurnitureItem, ItemDraft, LayoutRecord, PlannerStorageData, Rotation } from './types/planner';
import { clampRectToBounds, getItemFootprint, getItemIssues } from './utils/geometry';
import { makeId } from './utils/id';
import { clampZoom, snapCmToGrid } from './utils/scale';

type TabId = 'add' | 'edit' | 'items' | 'layouts';

const TAB_LABELS: Record<TabId, string> = {
  add: 'Add',
  edit: 'Edit',
  items: 'Items',
  layouts: 'Layouts',
};

function updateLayout(
  state: PlannerStorageData,
  layoutId: string,
  transform: (layout: LayoutRecord) => LayoutRecord,
) {
  return {
    ...state,
    layouts: state.layouts.map((layout) => (layout.id === layoutId ? transform(layout) : layout)),
  };
}

export default function App() {
  const [plannerData, setPlannerData] = useState<PlannerStorageData>(() => loadPlannerData());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('add');
  const [zoom, setZoom] = useState(1);
  const [panMode, setPanMode] = useState(false);
  const [pan, setPan] = useState({ x: 16, y: 16 });
  const [importError, setImportError] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const activeLayout =
    plannerData.layouts.find((layout) => layout.id === plannerData.activeLayoutId) ??
    plannerData.layouts[0] ??
    createDefaultStorageData().layouts[0];

  const nextItemLabel = `Item ${activeLayout.items.length + 1}`;
  const selectedItem =
    activeLayout.items.find((item) => item.id === selectedItemId) ?? null;
  const itemIssues = useMemo(
    () => getItemIssues(activeLayout.items, floorPlanBoundsCm.width, floorPlanBoundsCm.height),
    [activeLayout.items],
  );

  useEffect(() => {
    savePlannerData(plannerData);
  }, [plannerData]);

  useEffect(() => {
    if (selectedItemId && !activeLayout.items.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(null);
    }
  }, [activeLayout.items, selectedItemId]);

  const applyItems = (transform: (items: FurnitureItem[]) => FurnitureItem[]) => {
    setPlannerData((current) =>
      updateLayout(current, activeLayout.id, (layout) => ({
        ...layout,
        items: transform(layout.items),
        updatedAt: new Date().toISOString(),
      })),
    );
  };

  const handleAddItem = (draft: ItemDraft) => {
    const item: FurnitureItem = {
      id: makeId('item'),
      label: draft.label.trim() || nextItemLabel,
      widthCm: Number(draft.widthCm),
      heightCm: Number(draft.heightCm),
      color: draft.color.trim(),
      xCm: 25,
      yCm: 25,
      rotation: 0,
    };

    applyItems((items) => [...items, item]);
    setSelectedItemId(item.id);
  };

  const handleItemChange = (itemId: string, patch: Partial<FurnitureItem>) => {
    applyItems((items) =>
      items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const next = { ...item, ...patch };
        return {
          ...next,
          widthCm: Math.max(1, next.widthCm),
          heightCm: Math.max(1, next.heightCm),
        };
      }),
    );
  };

  const handleMoveItem = (itemId: string, xCm: number, yCm: number) => {
    applyItems((items) =>
      items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const footprint = getItemFootprint({ ...item, xCm, yCm });
        const clamped = clampRectToBounds(
          {
            ...footprint,
            xCm: snapCmToGrid(xCm),
            yCm: snapCmToGrid(yCm),
          },
          floorPlanBoundsCm.width,
          floorPlanBoundsCm.height,
        );

        return {
          ...item,
          xCm: clamped.xCm,
          yCm: clamped.yCm,
        };
      }),
    );
  };

  const handleRotate = (itemId: string) => {
    applyItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              rotation: (((item.rotation + 90) % 360) as Rotation),
            }
          : item,
      ),
    );
  };

  const handleDuplicateItem = (itemId: string) => {
    const original = activeLayout.items.find((item) => item.id === itemId);
    if (!original) {
      return;
    }

    const duplicate: FurnitureItem = {
      ...original,
      id: makeId('item'),
      label: `${original.label} Copy`,
      xCm: original.xCm + 25,
      yCm: original.yCm + 25,
      locked: false,
    };

    applyItems((items) => [...items, duplicate]);
    setSelectedItemId(duplicate.id);
  };

  const handleDeleteItem = (itemId: string) => {
    applyItems((items) => items.filter((item) => item.id !== itemId));
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
  };

  const handleCreateLayout = () => {
    const name = window.prompt('Layout name', `Layout ${plannerData.layouts.length + 1}`)?.trim();
    if (!name) {
      return;
    }

    const layout = createEmptyLayout(name);
    setPlannerData((current) => ({
      ...current,
      activeLayoutId: layout.id,
      layouts: [layout, ...current.layouts],
    }));
    setSelectedItemId(null);
  };

  const handleRenameLayout = (layoutId: string) => {
    const layout = plannerData.layouts.find((entry) => entry.id === layoutId);
    if (!layout) {
      return;
    }

    const nextName = window.prompt('Rename layout', layout.name)?.trim();
    if (!nextName) {
      return;
    }

    setPlannerData((current) =>
      updateLayout(current, layoutId, (entry) => ({
        ...entry,
        name: nextName,
        updatedAt: new Date().toISOString(),
      })),
    );
  };

  const handleDuplicateLayout = (layoutId: string) => {
    const layout = plannerData.layouts.find((entry) => entry.id === layoutId);
    if (!layout) {
      return;
    }

    const duplicate: LayoutRecord = {
      ...layout,
      id: makeId('layout'),
      name: `${layout.name} Copy`,
      updatedAt: new Date().toISOString(),
      items: layout.items.map((item) => ({ ...item, id: makeId('item') })),
    };

    setPlannerData((current) => ({
      ...current,
      activeLayoutId: duplicate.id,
      layouts: [duplicate, ...current.layouts],
    }));
  };

  const handleDeleteLayout = (layoutId: string) => {
    if (plannerData.layouts.length === 1) {
      window.alert('Keep at least one layout.');
      return;
    }

    setPlannerData((current) => {
      const layouts = current.layouts.filter((layout) => layout.id !== layoutId);
      return {
        ...current,
        activeLayoutId:
          current.activeLayoutId === layoutId ? layouts[0]?.id ?? null : current.activeLayoutId,
        layouts,
      };
    });
    setSelectedItemId(null);
  };

  const handleImport = async (file: File) => {
    setImportError(null);
    const raw = await file.text();
    const parsed = parsePlannerData(raw);
    if (!parsed.ok || !parsed.data) {
      setImportError(parsed.error ?? 'Import failed.');
      return;
    }

    setPlannerData(parsed.data);
    setSelectedItemId(null);
    setActiveTab('layouts');
  };

  const selectedItemWarning = selectedItem
    ? itemIssues.outOfBounds.has(selectedItem.id)
      ? 'This item extends outside the reconstructed apartment bounds.'
      : itemIssues.overlaps.has(selectedItem.id)
        ? 'This item overlaps another item.'
        : null
    : null;

  return (
    <div className="appShell">
      <header className="topBar">
        <div>
          <p className="eyebrow">Apartment Layout Planner</p>
          <h1>{activeLayout.name}</h1>
        </div>
        <div className="topActions">
          <button className={panMode ? 'secondaryButton isActive' : 'secondaryButton'} type="button" onClick={() => setPanMode((current) => !current)}>
            {panMode ? 'Canvas Pan On' : 'Pan Canvas'}
          </button>
          <button className="secondaryButton" type="button" onClick={() => setZoom((current) => clampZoom(current - 0.2))}>
            -
          </button>
          <span className="zoomReadout">{Math.round(zoom * 100)}%</span>
          <button className="secondaryButton" type="button" onClick={() => setZoom((current) => clampZoom(current + 0.2))}>
            +
          </button>
          <button className="secondaryButton" type="button" onClick={() => { setZoom(1); setPan({ x: 16, y: 16 }); }}>
            Reset View
          </button>
        </div>
      </header>

      <main className="plannerLayout">
        <section className="canvasPanel">
          <div className="canvasMeta">
            <span>Grid: {CM_PER_GRID} cm cells</span>
            <span>{activeLayout.items.length} item(s)</span>
            <span>Apartment Sketch</span>
          </div>
          <FloorPlanCanvas
            boundsCm={floorPlanBoundsCm}
            wallSegments={floorPlanWalls}
            guideSegments={floorPlanGuides}
            items={activeLayout.items}
            selectedItemId={selectedItemId}
            viewportWidth={viewportWidth}
            zoom={zoom}
            pan={pan}
            panMode={panMode}
            itemWarnings={itemIssues}
            onSelectItem={setSelectedItemId}
            onMoveItem={handleMoveItem}
            onPanChange={setPan}
          />
          <div className="planNotes">
            {floorPlanDebug.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </section>

        <section className="controlPanel">
          <div className="tabRow">
            {(Object.keys(TAB_LABELS) as TabId[]).map((tabId) => (
              <button
                className={`tabButton ${activeTab === tabId ? 'tabButtonActive' : ''}`}
                key={tabId}
                type="button"
                onClick={() => setActiveTab(tabId)}
              >
                {TAB_LABELS[tabId]}
              </button>
            ))}
          </div>

          <div className="tabPanel">
            {activeTab === 'add' ? (
              <ItemForm nextItemLabel={nextItemLabel} onAdd={handleAddItem} />
            ) : null}
            {activeTab === 'edit' ? (
              <ItemEditor
                item={selectedItem}
                warning={selectedItemWarning}
                onChange={handleItemChange}
                onRotate={handleRotate}
                onDuplicate={handleDuplicateItem}
                onDelete={handleDeleteItem}
              />
            ) : null}
            {activeTab === 'items' ? (
              <ItemList
                items={activeLayout.items}
                selectedItemId={selectedItemId}
                onSelect={(itemId) => {
                  setSelectedItemId(itemId);
                  setActiveTab('edit');
                }}
              />
            ) : null}
            {activeTab === 'layouts' ? (
              <LayoutManager
                layouts={plannerData.layouts}
                activeLayoutId={plannerData.activeLayoutId}
                importError={importError}
                onSelect={(layoutId) => {
                  setPlannerData((current) => ({ ...current, activeLayoutId: layoutId }));
                  setSelectedItemId(null);
                }}
                onCreate={handleCreateLayout}
                onRename={handleRenameLayout}
                onDuplicate={handleDuplicateLayout}
                onDelete={handleDeleteLayout}
                onExport={() => exportPlannerData(plannerData)}
                onImport={handleImport}
              />
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
