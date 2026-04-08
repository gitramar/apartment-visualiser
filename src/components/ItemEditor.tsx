import type { FurnitureItem } from '../types/planner';

interface ItemEditorProps {
  item: FurnitureItem | null;
  warning?: string | null;
  onChange: (itemId: string, patch: Partial<FurnitureItem>) => void;
  onRotate: (itemId: string) => void;
  onDuplicate: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

export function ItemEditor({
  item,
  warning,
  onChange,
  onRotate,
  onDuplicate,
  onDelete,
}: ItemEditorProps) {
  if (!item) {
    return <p className="emptyState">Select an item on the plan to edit it.</p>;
  }

  return (
    <div className="panelForm">
      {warning ? <p className="warningBanner">{warning}</p> : null}

      <label>
        Label
        <input value={item.label} onChange={(event) => onChange(item.id, { label: event.target.value })} />
      </label>

      <div className="twoCol">
        <label>
          Width (cm)
          <input
            inputMode="numeric"
            value={item.widthCm}
            onChange={(event) => onChange(item.id, { widthCm: Number(event.target.value) || item.widthCm })}
          />
        </label>
        <label>
          Height (cm)
          <input
            inputMode="numeric"
            value={item.heightCm}
            onChange={(event) =>
              onChange(item.id, { heightCm: Number(event.target.value) || item.heightCm })
            }
          />
        </label>
      </div>

      <label>
        Color
        <div className="colorField">
          <input type="color" value={item.color} onChange={(event) => onChange(item.id, { color: event.target.value })} />
          <input value={item.color} onChange={(event) => onChange(item.id, { color: event.target.value })} />
        </div>
      </label>

      <div className="twoCol">
        <label>
          X (cm)
          <input
            inputMode="numeric"
            value={Math.round(item.xCm)}
            onChange={(event) => onChange(item.id, { xCm: Number(event.target.value) || 0 })}
          />
        </label>
        <label>
          Y (cm)
          <input
            inputMode="numeric"
            value={Math.round(item.yCm)}
            onChange={(event) => onChange(item.id, { yCm: Number(event.target.value) || 0 })}
          />
        </label>
      </div>

      <label className="toggleRow">
        <input
          type="checkbox"
          checked={Boolean(item.locked)}
          onChange={(event) => onChange(item.id, { locked: event.target.checked })}
        />
        Lock item position
      </label>

      <div className="actionRow">
        <button className="secondaryButton" type="button" onClick={() => onRotate(item.id)}>
          Rotate 90°
        </button>
        <button className="secondaryButton" type="button" onClick={() => onDuplicate(item.id)}>
          Duplicate
        </button>
      </div>

      <button className="dangerButton" type="button" onClick={() => onDelete(item.id)}>
        Delete Item
      </button>
    </div>
  );
}
