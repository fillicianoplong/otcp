import { describe, expect, it } from 'vitest';

import {
  FORMAT_CATALOG,
  formatDisplayName,
  getFormatById,
  isKnownFormatId,
  listFormats,
  listFormatsNewestFirst,
  normalizeFormatId,
} from '../../src/format/formatCatalog.ts';
import { formatCatalogSortDatePrefix } from '../../src/format/formatSortDateLabel.ts';

describe('formatCatalog', () => {
  it('lists Advanced, Traditional, and S-03 historical formats', () => {
    expect(listFormats()).toHaveLength(5);
    expect(FORMAT_CATALOG.map((f) => f.id)).toEqual([
      'advanced',
      'traditional',
      'hat',
      'tengu',
      'goat',
    ]);
  });

  it('sorts formats newest banlist date first', () => {
    const ids = listFormatsNewestFirst().map((f) => f.id);
    expect(ids).toEqual(['advanced', 'traditional', 'hat', 'tengu', 'goat']);
  });

  it('resolves format ids case-insensitively', () => {
    expect(normalizeFormatId('Advanced')).toBe('advanced');
    expect(normalizeFormatId('GOAT')).toBe('goat');
    expect(normalizeFormatId('edison')).toBeNull();
  });

  it('looks up definitions by id', () => {
    const advanced = getFormatById('advanced');
    expect(advanced?.name).toBe('Advanced');
    expect(advanced?.poolRule).toBe('full-tcg');
    expect(advanced?.traditionalForbiddenAsLimited).toBe(false);
    expect(advanced?.sortDate).toBe('2026-02-02');
    expect(advanced?.sortDateSource).toContain('yugioh-card.com/en/limited/list_2026-02-02');

    const goat = getFormatById('goat');
    expect(goat?.poolRule).toBe('tcg-earliest-on-or-before');
    expect(goat?.poolCutoffDate).toBe('2005-08-31');
    expect(goat?.banlistSource).toBe('curated-snapshot');
    expect(goat?.sortDate).toBe('2005-04-01');

    const traditional = getFormatById('traditional');
    expect(traditional?.traditionalForbiddenAsLimited).toBe(true);
    expect(traditional?.sortDate).toBe('2026-02-02');
  });

  it('treats only catalog ids as known format params', () => {
    expect(isKnownFormatId('advanced')).toBe(true);
    expect(isKnownFormatId('hat')).toBe(true);
    expect(isKnownFormatId('tcg')).toBe(false);
    expect(isKnownFormatId('')).toBe(false);
  });

  it('formats display names from the catalog', () => {
    expect(formatDisplayName('traditional')).toBe('Traditional');
    expect(formatDisplayName('tengu')).toBe('Tengu Plant');
  });
});

describe('formatCatalogSortDatePrefix', () => {
  it('returns full YYYY-MM-DD from catalog sortDate for format labels', () => {
    expect(formatCatalogSortDatePrefix('2026-02-02')).toBe('2026-02-02');
    expect(formatCatalogSortDatePrefix('2005-04-01')).toBe('2005-04-01');
    expect(formatCatalogSortDatePrefix(undefined)).toBeNull();
    expect(formatCatalogSortDatePrefix('not-a-date')).toBeNull();
  });
});
