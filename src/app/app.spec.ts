import { describe, it, expect } from 'vitest';
import { LABEL_COLORS, COLUMNS } from './models/card.model';

// Minimal unit-test smoke checks. The richer behaviour (real-time sync, CRUD,
// drag-and-drop) is exercised end-to-end via Playwright in `e2e/`.

describe('domain model', () => {
  it('exposes three columns in the expected order', () => {
    expect(COLUMNS.map((c) => c.id)).toEqual(['todo', 'progress', 'done']);
  });

  it('exposes a non-empty label palette', () => {
    expect(LABEL_COLORS.length).toBeGreaterThan(0);
    for (const l of LABEL_COLORS) {
      expect(l.value).toMatch(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    }
  });
});
