/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CATALOG_VIEW_STORAGE_KEY_SEARCH,
  displayCatalogViewMode,
  readCatalogViewPreference,
  resolveCatalogViewPreference,
  writeCatalogViewPreference,
} from '../../src/catalog/catalogViewMode.ts';

describe('catalog view preference', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('resolves URL param over stored value and default', () => {
    expect(
      resolveCatalogViewPreference({
        urlParam: 'list',
        storedRaw: 'table',
        defaultMode: 'grid',
      }),
    ).toEqual({ mode: 'list', invalidStored: false });

    expect(
      resolveCatalogViewPreference({
        urlParam: null,
        storedRaw: 'table',
        defaultMode: 'grid',
      }),
    ).toEqual({ mode: 'table', invalidStored: false });

    expect(
      resolveCatalogViewPreference({
        urlParam: null,
        storedRaw: null,
        defaultMode: 'grid',
      }),
    ).toEqual({ mode: 'grid', invalidStored: false });
  });

  it('marks invalid stored values without treating them as a mode', () => {
    const resolved = resolveCatalogViewPreference({
      urlParam: null,
      storedRaw: 'carousel',
      defaultMode: 'grid',
    });
    expect(resolved.invalidStored).toBe(true);
    expect(displayCatalogViewMode(resolved, { tableAvailable: true })).toBe('grid');
    expect(displayCatalogViewMode(resolved, { tableAvailable: false })).toBe('list');
  });

  it('falls back from table on narrow viewports without invalid storage', () => {
    const resolved = resolveCatalogViewPreference({
      urlParam: null,
      storedRaw: 'table',
      defaultMode: 'grid',
    });
    expect(displayCatalogViewMode(resolved, { tableAvailable: false })).toBe('list');
    expect(displayCatalogViewMode(resolved, { tableAvailable: true })).toBe('table');
  });

  it('reads and writes search preference under a namespaced key', () => {
    localStorage.clear();
    writeCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH, 'list');
    expect(readCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH)).toBe('list');
  });

  it('read returns null when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH)).toBeNull();
  });
});
