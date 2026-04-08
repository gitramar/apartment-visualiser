import type { FurnitureItem } from '../types/planner';
import { getItemFootprint } from '../utils/geometry';

interface ItemListProps {
  items: FurnitureItem[];
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
}

export function ItemList({ items, selectedItemId, onSelect }: ItemListProps) {
  if (items.length === 0) {
    return <p className="emptyState">No items yet. Add one from the Add tab.</p>;
  }

  return (
    <div className="itemList">
      {items.map((item) => {
        const footprint = getItemFootprint(item);

        return (
          <button
            className={`itemCard ${selectedItemId === item.id ? 'itemCardSelected' : ''}`}
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
          >
            <span className="swatch" style={{ background: item.color }} />
            <span>
              <strong>{item.label || 'Untitled item'}</strong>
              <small>
                {Math.round(footprint.widthCm)} × {Math.round(footprint.heightCm)} cm
                {item.locked ? ' · Locked' : ''}
              </small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
