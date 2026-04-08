import type { LayoutRecord } from '../types/planner';

interface LayoutManagerProps {
  layouts: LayoutRecord[];
  activeLayoutId: string | null;
  importError: string | null;
  onSelect: (layoutId: string) => void;
  onCreate: () => void;
  onRename: (layoutId: string) => void;
  onDuplicate: (layoutId: string) => void;
  onDelete: (layoutId: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function LayoutManager({
  layouts,
  activeLayoutId,
  importError,
  onSelect,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
  onImport,
}: LayoutManagerProps) {
  return (
    <div className="layoutManager">
      <div className="actionRow">
        <button className="primaryButton" type="button" onClick={onCreate}>
          New Layout
        </button>
        <button className="secondaryButton" type="button" onClick={onExport}>
          Export JSON
        </button>
      </div>

      <label className="fileButton">
        Import JSON
        <input
          accept="application/json"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImport(file);
            }
            event.currentTarget.value = '';
          }}
        />
      </label>

      {importError ? <p className="fieldError">{importError}</p> : null}

      <div className="itemList">
        {layouts.map((layout) => (
          <div className={`layoutCard ${layout.id === activeLayoutId ? 'layoutCardActive' : ''}`} key={layout.id}>
            <button className="layoutPrimary" type="button" onClick={() => onSelect(layout.id)}>
              <strong>{layout.name}</strong>
              <small>{layout.items.length} item(s)</small>
            </button>
            <div className="layoutActions">
              <button type="button" onClick={() => onRename(layout.id)}>
                Rename
              </button>
              <button type="button" onClick={() => onDuplicate(layout.id)}>
                Copy
              </button>
              <button type="button" onClick={() => onDelete(layout.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
