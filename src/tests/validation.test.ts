import { isPlannerStorageData, validateItemDraft } from '../utils/validation';

describe('item validation', () => {
  it('accepts a valid draft', () => {
    expect(
      validateItemDraft({
        label: 'Sofa',
        widthCm: '220',
        heightCm: '95',
        color: '#5f8f6e',
      }).valid,
    ).toBe(true);
  });

  it('rejects invalid dimensions and colors', () => {
    const result = validateItemDraft({
      label: 'Bad',
      widthCm: '0',
      heightCm: '-1',
      color: '###',
    });

    expect(result.valid).toBe(false);
    expect(result.errors.widthCm).toBeTruthy();
    expect(result.errors.heightCm).toBeTruthy();
    expect(result.errors.color).toBeTruthy();
  });

  it('validates planner storage shape', () => {
    expect(
      isPlannerStorageData({
        version: 1,
        activeLayoutId: 'layout-1',
        layouts: [],
      }),
    ).toBe(true);
  });
});
