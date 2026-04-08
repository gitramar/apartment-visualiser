import { useEffect, useMemo, useState } from 'react';
import { FloorPlanCanvas } from './components/FloorPlanCanvas';
import { ItemEditor } from './components/ItemEditor';
import { ItemForm, ITEM_PRESETS } from './components/ItemForm';
import { ItemList } from './components/ItemList';
import { LayoutManager } from './components/LayoutManager';
import { CM_PER_GRID, floorPlanBoundsCm, floorPlanGuides, floorPlanWalls } from './data/floorPlan';
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
import { clampZoom, cmToPx, snapCmToGrid } from './utils/scale';

type TabId = 'add' | 'edit' | 'items' | 'layouts';
type MobilePanelId = Exclude<TabId, 'add'> | null;
type RingMenuState = {
  screenX: number;
  screenY: number;
  xCm: number;
  yCm: number;
  highlightedLabel: string | null;
};

const TAB_LABELS: Record<TabId, string> = {
  add: 'Add',
  edit: 'Selected',
  items: 'Library',
  layouts: 'Plans',
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
  const [activeTab, setActiveTab] = useState<TabId>(() => (window.innerWidth < 900 ? 'items' : 'add'));
  const [mobilePanel, setMobilePanel] = useState<MobilePanelId>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 16, y: 16 });
  const [importError, setImportError] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(() => window.innerWidth);
  const [viewportHeight, setViewportHeight] = useState<number>(() => window.innerHeight);
  const [pendingPlacement, setPendingPlacement] = useState<ItemDraft | null>(null);
  const [ringMenu, setRingMenu] = useState<RingMenuState | null>(null);
  const isMobileViewport = viewportWidth < 900;

  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
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

  useEffect(() => {
    if (!isMobileViewport) {
      setMobilePanel(null);
      setRingMenu(null);
    }
  }, [isMobileViewport]);

  const applyItems = (transform: (items: FurnitureItem[]) => FurnitureItem[]) => {
    setPlannerData((current) =>
      updateLayout(current, activeLayout.id, (layout) => ({
        ...layout,
        items: transform(layout.items),
        updatedAt: new Date().toISOString(),
      })),
    );
  };

  const createItemAt = (draft: ItemDraft, xCm: number, yCm: number, selectItem = true) => {
    const widthCm = Number(draft.widthCm);
    const heightCm = Number(draft.heightCm);
    const clamped = clampRectToBounds(
      {
        xCm: snapCmToGrid(xCm - widthCm / 2),
        yCm: snapCmToGrid(yCm - heightCm / 2),
        widthCm,
        heightCm,
      },
      floorPlanBoundsCm.width,
      floorPlanBoundsCm.height,
    );

    const item: FurnitureItem = {
      id: makeId('item'),
      label: draft.label.trim() || nextItemLabel,
      widthCm,
      heightCm,
      color: draft.color.trim(),
      xCm: clamped.xCm,
      yCm: clamped.yCm,
      rotation: 0,
    };

    applyItems((items) => [...items, item]);
    if (selectItem) {
      setSelectedItemId(item.id);
      if (isMobileViewport) {
        setMobilePanel('edit');
      }
    }
  };

  const handleAddItem = (draft: ItemDraft) => {
    createItemAt(draft, 25 + Number(draft.widthCm) / 2, 25 + Number(draft.heightCm) / 2);
  };

  const handlePreparePlacement = (draft: ItemDraft) => {
    setPendingPlacement(draft);
    setSelectedItemId(null);
    if (isMobileViewport) {
      setMobilePanel(null);
    }
  };

  const handlePlacePendingItem = (xCm: number, yCm: number) => {
    if (!pendingPlacement) {
      return;
    }

    createItemAt(pendingPlacement, xCm, yCm, false);
    setSelectedItemId(null);
    setPendingPlacement(null);
  };

  const handleOpenRingMenu = (screenX: number, screenY: number, xCm: number, yCm: number) => {
    if (!isMobileViewport || pendingPlacement) {
      return;
    }

    setSelectedItemId(null);
    setMobilePanel(null);
    setRingMenu({ screenX, screenY, xCm, yCm, highlightedLabel: null });
  };

  const handleRingMenuSelect = (draft: ItemDraft | null) => {
    if (!ringMenu || !draft) {
      setRingMenu(null);
      return;
    }

    createItemAt(draft, ringMenu.xCm, ringMenu.yCm, false);
    setRingMenu(null);
  };

  const handleRingMenuMove = (clientX: number, clientY: number) => {
    setRingMenu((current) => {
      if (!current) {
        return current;
      }

      const dx = clientX - current.screenX;
      const dy = clientY - current.screenY;
      const distance = Math.hypot(dx, dy);
      if (distance < 48 || distance > 168) {
        return current.highlightedLabel ? { ...current, highlightedLabel: null } : current;
      }

      let bestPreset = ITEM_PRESETS[0] ?? null;
      let bestScore = Number.POSITIVE_INFINITY;
      ITEM_PRESETS.forEach((preset, index) => {
        const angle = (Math.PI * 2 * index) / ITEM_PRESETS.length - Math.PI / 2;
        const radius = 94;
        const itemX = current.screenX + Math.cos(angle) * radius;
        const itemY = current.screenY + Math.sin(angle) * radius;
        const score = Math.hypot(clientX - itemX, clientY - itemY);
        if (score < bestScore) {
          bestScore = score;
          bestPreset = preset;
        }
      });

      const highlightedLabel = bestScore <= 58 ? bestPreset?.label ?? null : null;
      return highlightedLabel === current.highlightedLabel ? current : { ...current, highlightedLabel };
    });
  };

  const handleRingMenuRelease = () => {
    if (!ringMenu?.highlightedLabel) {
      setRingMenu(null);
      return;
    }

    const preset = ITEM_PRESETS.find((entry) => entry.label === ringMenu.highlightedLabel) ?? null;
    handleRingMenuSelect(preset);
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
    setMobilePanel('layouts');
  };

  const selectedItemWarning = selectedItem
    ? itemIssues.outOfBounds.has(selectedItem.id)
      ? 'This item extends outside the reconstructed apartment bounds.'
      : itemIssues.overlaps.has(selectedItem.id)
        ? 'This item overlaps another item.'
        : null
    : null;

  const handleSelectItem = (itemId: string | null) => {
    setSelectedItemId(itemId);
    if (itemId && isMobileViewport) {
      setMobilePanel('edit');
    }
  };

  const closeMobilePanel = () => {
    if (isMobileViewport) {
      setMobilePanel(null);
    }
  };

  const handleZoomChange = (nextZoom: number) => {
    setZoom(clampZoom(nextZoom));
  };

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const stageWidth = viewportWidth;
    const stageHeight = viewportHeight;
    const planWidthPx = cmToPx(floorPlanBoundsCm.width);
    const planHeightPx = cmToPx(floorPlanBoundsCm.height);
    const padding = 32;
    const fitZoom = clampZoom(
      Math.min(
        (stageWidth - padding * 2) / planWidthPx,
        (stageHeight - padding * 2) / planHeightPx,
      ),
    );

    setZoom(fitZoom);
    setPan({
      x: Math.round((stageWidth - planWidthPx * fitZoom) / 2),
      y: Math.round((stageHeight - planHeightPx * fitZoom) / 2),
    });
  }, [isFullscreen, viewportWidth, viewportHeight]);

  const visibleMobilePanel = mobilePanel;

  const mobilePanelTitle =
    visibleMobilePanel === 'edit'
        ? selectedItem
          ? selectedItem.label
          : 'Edit Item'
        : visibleMobilePanel === 'items'
          ? 'Items'
          : 'Layouts';

  const panelContent = (
    <div className="tabPanel">
      {activeTab === 'add' ? (
        <ItemForm
          nextItemLabel={nextItemLabel}
          onAdd={handleAddItem}
          compactMode={isMobileViewport}
          onPickPreset={handlePreparePlacement}
        />
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
            if (isMobileViewport) {
              setMobilePanel('edit');
            } else {
              setActiveTab('edit');
            }
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
            if (isMobileViewport) {
              setMobilePanel(null);
            }
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
  );

  return (
    <div className={`appShell ${isFullscreen ? 'appShellFullscreen' : ''}`}>
      {!isFullscreen && !isMobileViewport ? (
      <header className="topBar">
        <div className="topBarTitle">
          <p className="eyebrow">Apartment Layout Planner</p>
          <h1>{activeLayout.name}</h1>
        </div>
        <div className="topActions">
          {isMobileViewport ? (
            <button className={activeTab === 'layouts' ? 'secondaryButton isActive' : 'secondaryButton'} type="button" onClick={() => setActiveTab('layouts')}>
              Plans
            </button>
          ) : null}
          <div className="zoomControls">
            <button className="secondaryButton zoomButton" type="button" onClick={() => setZoom((current) => clampZoom(current - 0.2))}>
              -
            </button>
            <span className="zoomReadout">{Math.round(zoom * 100)}%</span>
            <button className="secondaryButton zoomButton" type="button" onClick={() => setZoom((current) => clampZoom(current + 0.2))}>
              +
            </button>
          </div>
          <button className="secondaryButton" type="button" onClick={() => { setZoom(1); setPan({ x: 16, y: 16 }); }}>
            Reset View
          </button>
          <button className="secondaryButton" type="button" onClick={() => setIsFullscreen(true)}>
            Full Screen
          </button>
        </div>
      </header>
      ) : null}

      <main className="plannerLayout">
        <section className="canvasPanel">
          {!isFullscreen ? (
          <div className="canvasMeta">
            <span>{activeLayout.name}</span>
            <span>{activeLayout.items.length} item(s)</span>
            <span>Grid: {CM_PER_GRID} cm</span>
          </div>
          ) : null}
          <FloorPlanCanvas
            boundsCm={floorPlanBoundsCm}
            wallSegments={floorPlanWalls}
            guideSegments={floorPlanGuides}
            items={activeLayout.items}
            selectedItemId={selectedItemId}
            viewportWidth={viewportWidth}
            viewportHeight={viewportHeight}
            zoom={zoom}
            pan={pan}
            isFullscreen={isFullscreen}
            pendingPlacement={pendingPlacement}
            itemWarnings={itemIssues}
            onSelectItem={handleSelectItem}
            onMoveItem={handleMoveItem}
            onPanChange={setPan}
            onZoomChange={handleZoomChange}
            onOpenRingMenu={handleOpenRingMenu}
            onPlaceItem={handlePlacePendingItem}
          />

          {isFullscreen ? (
            <button className="fullscreenExitButton" type="button" onClick={() => setIsFullscreen(false)}>
              Exit Full Screen
            </button>
          ) : null}

          {pendingPlacement && !isFullscreen ? (
            <div className="placementBar">
              <div className="placementMeta">
                <strong>Placing {pendingPlacement.label}</strong>
                <span>Tap anywhere on the plan to drop it.</span>
              </div>
              <button className="secondaryButton" type="button" onClick={() => setPendingPlacement(null)}>
                Cancel
              </button>
            </div>
          ) : null}

          {isMobileViewport && selectedItem && !isFullscreen ? (
            <div className="mobileSelectionBar">
              <div className="mobileSelectionMeta">
                <strong>{selectedItem.label}</strong>
                <span>
                  {Math.round(getItemFootprint(selectedItem).widthCm)} x{' '}
                  {Math.round(getItemFootprint(selectedItem).heightCm)} cm
                </span>
              </div>
              <div className="mobileSelectionActions">
                <button className="secondaryButton" type="button" onClick={() => setActiveTab('edit')}>
                  Details
                </button>
                <button className="secondaryButton" type="button" onClick={() => handleRotate(selectedItem.id)}>
                  Rotate
                </button>
                <button className="secondaryButton" type="button" onClick={() => handleDuplicateItem(selectedItem.id)}>
                  Copy
                </button>
                <button className="dangerButton" type="button" onClick={() => handleDeleteItem(selectedItem.id)}>
                  Delete
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {isFullscreen ? null : isMobileViewport ? (
          <>
            {visibleMobilePanel ? (
            <div className="mobilePanelSheet">
              <div className="mobileSheetHandle" />
              <div className="mobileSheetHeader">
                <strong>{mobilePanelTitle}</strong>
                <div className="mobileSheetActions">
                  <button className="secondaryButton mobileCloseButton" type="button" onClick={() => setIsFullscreen(true)}>
                    Full Screen
                  </button>
                  {visibleMobilePanel !== 'items' ? (
                    <button className="secondaryButton mobileCloseButton" type="button" onClick={closeMobilePanel}>
                      Close
                    </button>
                  ) : null}
                </div>
              </div>
              {visibleMobilePanel === 'items'
                ? (
                  <div className="tabPanel">
                    <ItemList
                      items={activeLayout.items}
                      selectedItemId={selectedItemId}
                      onSelect={(itemId) => {
                        setSelectedItemId(itemId);
                        setMobilePanel('edit');
                      }}
                    />
                  </div>
                )
                : visibleMobilePanel === 'edit'
                  ? (
                    <div className="tabPanel">
                      <ItemEditor
                        item={selectedItem}
                        warning={selectedItemWarning}
                        onChange={handleItemChange}
                        onRotate={handleRotate}
                        onDuplicate={handleDuplicateItem}
                        onDelete={handleDeleteItem}
                      />
                    </div>
                  )
                  : (
                    <div className="tabPanel">
                      <LayoutManager
                        layouts={plannerData.layouts}
                        activeLayoutId={plannerData.activeLayoutId}
                        importError={importError}
                        onSelect={(layoutId) => {
                          setPlannerData((current) => ({ ...current, activeLayoutId: layoutId }));
                          setSelectedItemId(null);
                          setMobilePanel(null);
                        }}
                        onCreate={handleCreateLayout}
                        onRename={handleRenameLayout}
                        onDuplicate={handleDuplicateLayout}
                        onDelete={handleDeleteLayout}
                        onExport={() => exportPlannerData(plannerData)}
                        onImport={handleImport}
                      />
                    </div>
                  )}
            </div>
            ) : null}

            <nav className="mobileBottomBar" aria-label="Planner actions">
              {(['items', 'layouts'] as const).map((tabId) => (
                <button
                  className={`tabButton ${visibleMobilePanel === tabId ? 'tabButtonActive' : ''}`}
                  key={tabId}
                  type="button"
                  onClick={() => setMobilePanel((current) => (current === tabId ? null : tabId))}
                >
                  {TAB_LABELS[tabId]}
                </button>
              ))}
              <button
                className={`tabButton ${visibleMobilePanel === 'edit' ? 'tabButtonActive' : ''}`}
                type="button"
                onClick={() => {
                  if (selectedItem) {
                    setMobilePanel((current) => (current === 'edit' ? null : 'edit'));
                  }
                }}
              >
                Selected
              </button>
            </nav>
          </>
        ) : (
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

            {panelContent}
          </section>
        )}
      </main>

      {ringMenu ? (
        <div
          className="ringMenuOverlay"
          onClick={() => setRingMenu(null)}
          onPointerMove={(event) => handleRingMenuMove(event.clientX, event.clientY)}
          onPointerUp={handleRingMenuRelease}
          onPointerCancel={() => setRingMenu(null)}
        >
          <div
            className="ringMenu"
            style={{ left: ringMenu.screenX, top: ringMenu.screenY }}
            onClick={(event) => event.stopPropagation()}
          >
            {ITEM_PRESETS.map((preset, index) => {
              const angle = (Math.PI * 2 * index) / ITEM_PRESETS.length - Math.PI / 2;
              const radius = 94;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <button
                  key={preset.label}
                  className={`ringMenuItem ${ringMenu.highlightedLabel === preset.label ? 'ringMenuItemActive' : ''}`}
                  style={{ transform: `translate(${Math.round(x)}px, ${Math.round(y)}px)` }}
                  type="button"
                  onClick={() => handleRingMenuSelect(preset)}
                >
                  <span className="ringMenuGlyph">
                    {preset.label
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span className="ringMenuSwatch" style={{ background: preset.color }} />
                  <span>{preset.label}</span>
                </button>
              );
            })}
            <button className="ringMenuCenter" type="button" onClick={() => setRingMenu(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
