import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { ItemDraft } from '../types/planner';
import { validateItemDraft } from '../utils/validation';

const PRESETS = [
  { label: 'Sofa', widthCm: '220', heightCm: '95', color: '#5f8f6e' },
  { label: 'Bed', widthCm: '180', heightCm: '200', color: '#7897c0' },
  { label: 'TV Bench', widthCm: '160', heightCm: '40', color: '#9d7d5f' },
  { label: 'Coffee Table', widthCm: '120', heightCm: '60', color: '#c09152' },
  { label: 'Dining Table', widthCm: '160', heightCm: '90', color: '#8c6a43' },
  { label: 'Bookshelf', widthCm: '90', heightCm: '35', color: '#80776f' },
];

const initialDraft: ItemDraft = {
  label: '',
  widthCm: '120',
  heightCm: '60',
  color: '#5f8f6e',
};

interface ItemFormProps {
  nextItemLabel: string;
  onAdd: (draft: ItemDraft) => void;
}

export function ItemForm({ nextItemLabel, onAdd }: ItemFormProps) {
  const [draft, setDraft] = useState<ItemDraft>({ ...initialDraft, label: nextItemLabel });
  const validation = useMemo(() => validateItemDraft(draft), [draft]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const resolvedDraft = {
      ...draft,
      label: draft.label.trim() || nextItemLabel,
    };

    const result = validateItemDraft(resolvedDraft);
    if (!result.valid) {
      setDraft(resolvedDraft);
      return;
    }

    onAdd(resolvedDraft);
    setDraft({ ...initialDraft, label: nextItemLabel });
  };

  return (
    <form className="panelForm" onSubmit={handleSubmit}>
      <div className="presetRow">
        {PRESETS.map((preset) => (
          <button
            className="chipButton"
            key={preset.label}
            type="button"
            onClick={() => setDraft(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <label>
        Label
        <input
          value={draft.label}
          onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
          placeholder={nextItemLabel}
        />
        {validation.errors.label ? <span className="fieldError">{validation.errors.label}</span> : null}
      </label>

      <div className="twoCol">
        <label>
          Width (cm)
          <input
            inputMode="numeric"
            value={draft.widthCm}
            onChange={(event) =>
              setDraft((current) => ({ ...current, widthCm: event.target.value }))
            }
          />
          {validation.errors.widthCm ? (
            <span className="fieldError">{validation.errors.widthCm}</span>
          ) : null}
        </label>
        <label>
          Height (cm)
          <input
            inputMode="numeric"
            value={draft.heightCm}
            onChange={(event) =>
              setDraft((current) => ({ ...current, heightCm: event.target.value }))
            }
          />
          {validation.errors.heightCm ? (
            <span className="fieldError">{validation.errors.heightCm}</span>
          ) : null}
        </label>
      </div>

      <label>
        Color
        <div className="colorField">
          <input
            type="color"
            value={draft.color.startsWith('#') ? draft.color : '#5f8f6e'}
            onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
          />
          <input
            value={draft.color}
            onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
          />
        </div>
        {validation.errors.color ? <span className="fieldError">{validation.errors.color}</span> : null}
      </label>

      <button className="primaryButton" type="submit">
        Add Item
      </button>
    </form>
  );
}
