/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';

import {
  DECK_ZONE_VIEW_STORAGE_KEY,
  readDeckZoneViewMode,
  writeDeckZoneViewMode,
} from '../../src/deckEditor/deckZoneView.ts';

describe('deck zone view', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to grid and stores the choice', () => {
    expect(readDeckZoneViewMode()).toBe('grid');
    writeDeckZoneViewMode('list');
    expect(localStorage.getItem(DECK_ZONE_VIEW_STORAGE_KEY)).toBe('list');
    expect(readDeckZoneViewMode()).toBe('list');
    writeDeckZoneViewMode('grid');
    expect(readDeckZoneViewMode()).toBe('grid');
  });
});
