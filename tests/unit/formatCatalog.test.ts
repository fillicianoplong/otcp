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
  it('lists core rulesets plus generated meta formats', () => {
    expect(listFormats().length).toBeGreaterThanOrEqual(101);
    expect(FORMAT_CATALOG.slice(0, 8).map((f) => f.id)).toEqual([
      'advanced',
      'traditional',
      'speed-duel',
      'genesys',
      'hat',
      'tengu',
      'edison',
      'goat',
    ]);
    expect(getFormatById('hypernova')?.banlistSource).toBe('tcg-dated-list');
  });

  it('sorts formats with Speed Duel and Genesys after Advanced and Traditional, then newest list dates', () => {
    const ids = listFormatsNewestFirst().map((f) => f.id);
    expect(ids.slice(0, 4)).toEqual(['advanced', 'traditional', 'speed-duel', 'genesys']);
    expect(ids.indexOf('hypernova')).toBeGreaterThan(3);
    expect(ids.indexOf('goat')).toBeGreaterThan(ids.indexOf('hypernova'));
  });

  it('resolves format ids case-insensitively', () => {
    expect(normalizeFormatId('Advanced')).toBe('advanced');
    expect(normalizeFormatId('GOAT')).toBe('goat');
    expect(normalizeFormatId('edison')).toBe('edison');
  });

  it('looks up definitions by id', () => {
    const advanced = getFormatById('advanced');
    expect(advanced?.name).toBe('Advanced');
    expect(advanced?.poolRule).toBe('full-tcg');
    expect(advanced?.traditionalForbiddenAsLimited).toBe(false);
    expect(advanced?.sortDate).toBe('2026-02-02');
    expect(advanced?.sortDateSource).toContain('yugioh-card.com/en/limited/list_2026-02-02');

    const edison = getFormatById('edison');
    expect(edison?.poolCutoffDate).toBe('2010-04-16');
    expect(edison?.banlistSource).toBe('curated-snapshot');
    expect(edison?.sortDate).toBe('2010-03-01');

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
    expect(isKnownFormatId('hypernova')).toBe(true);
    expect(isKnownFormatId('tcg')).toBe(false);
    expect(isKnownFormatId('')).toBe(false);
  });

  it('formats display names from the catalog', () => {
    expect(formatDisplayName('traditional')).toBe('Traditional');
    expect(formatDisplayName('tengu')).toBe('Tengu Plant');
    expect(formatDisplayName('edison')).toBe('Edison');
  });
});

describe('formatCatalogSortDatePrefix', () => {
  it('returns full YYYY-MM-DD from catalog sortDate for sorting metadata', () => {
    expect(formatCatalogSortDatePrefix('2026-02-02')).toBe('2026-02-02');
    expect(formatCatalogSortDatePrefix('2005-04-01')).toBe('2005-04-01');
    expect(formatCatalogSortDatePrefix(undefined)).toBeNull();
    expect(formatCatalogSortDatePrefix('not-a-date')).toBeNull();
  });
});
