import { describe, expect, it } from 'vitest';

import {
  readCatalogTableSortFromParams,
  writeCatalogTableSortToParams,
} from '../../src/catalog/catalogSortQuery.ts';

describe('catalogSortQuery', () => {
  it('reads a column and direction from the query', () => {
    const params = new URLSearchParams('sort=ban&dir=desc');
    expect(readCatalogTableSortFromParams(params)).toEqual({ column: 'ban', direction: 'desc' });
  });

  it('returns null when the query does not mention a sort', () => {
    expect(readCatalogTableSortFromParams(new URLSearchParams('q=mage'))).toBeNull();
  });

  it('drops the default name ascending sort from the query', () => {
    const params = new URLSearchParams('q=mage&sort=atk&dir=desc');
    writeCatalogTableSortToParams(params, { column: 'name', direction: 'asc' });
    expect(params.toString()).toBe('q=mage');
  });

  it('writes a non-default sort without removing other params', () => {
    const params = new URLSearchParams('format=advanced&view=table');
    writeCatalogTableSortToParams(params, { column: 'ban', direction: 'asc' });
    expect(params.get('format')).toBe('advanced');
    expect(params.get('view')).toBe('table');
    expect(params.get('sort')).toBe('ban');
    expect(params.get('dir')).toBe('asc');
  });
});
