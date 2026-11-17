import { describe, expect, it } from 'vitest';

import { CATALOG_TABLE_OPTIONAL_COLUMN_IDS } from './catalogTableColumns.ts';
import { parseSearchTablePrefsSnapshot } from './catalogTablePrefsStorage.ts';

describe('parseSearchTablePrefsSnapshot', () => {
  it('fills the default column order when an older save has none', () => {
    const parsed = parseSearchTablePrefsSnapshot({
      visibility: { atk: false },
      sort: { column: 'name', direction: 'asc' },
    });
    expect(parsed?.visibility.atk).toBe(false);
    expect(parsed?.order).toEqual([...CATALOG_TABLE_OPTIONAL_COLUMN_IDS]);
  });

  it('keeps a saved order and appends columns that are missing from it', () => {
    const parsed = parseSearchTablePrefsSnapshot({
      visibility: {},
      sort: { column: 'atk', direction: 'desc' },
      order: ['price', 'atk', 'name'],
    });
    expect(parsed?.order.slice(0, 2)).toEqual(['price', 'atk']);
    expect(parsed?.order).toEqual([
      'price',
      'atk',
      ...CATALOG_TABLE_OPTIONAL_COLUMN_IDS.filter((id) => id !== 'price' && id !== 'atk'),
    ]);
  });
});
