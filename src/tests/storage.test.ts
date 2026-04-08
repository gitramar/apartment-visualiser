import { createDefaultStorageData, parsePlannerData, serializePlannerData } from '../storage/plannerStorage';

describe('planner storage serialization', () => {
  it('round-trips valid planner data', () => {
    const data = createDefaultStorageData();
    const raw = serializePlannerData(data);
    const parsed = parsePlannerData(raw);

    expect(parsed.ok).toBe(true);
    expect(parsed.data?.layouts[0]?.name).toBe(data.layouts[0]?.name);
  });

  it('rejects malformed planner data', () => {
    const parsed = parsePlannerData('{"version":1,"layouts":"bad"}');
    expect(parsed.ok).toBe(false);
  });
});
