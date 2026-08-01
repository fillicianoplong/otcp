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
import { formatCatalogSortDateLabel } from '../../src/format/formatSortDateLabel.ts';

describe('formatCatalog', () => {
  it('lists Advanced and Traditional as the initial Must formats', () => {
    expect(listFormats()).toHaveLength(2);
    expect(FORMAT_CATALOG.map((f) => f.id)).toEqual(['advanced', 'traditional']);
  });

  it('sorts formats newest banlist date first', () => {
    const ids = listFormatsNewestFirst().map((f) => f.id);
    expect(ids).toEqual(['advanced', 'traditional']);
  });

  it('resolves format ids case-insensitively', () => {
    expect(normalizeFormatId('Advanced')).toBe('advanced');
    expect(normalizeFormatId('TRADITIONAL')).toBe('traditional');
    expect(normalizeFormatId('edison')).toBeNull();
  });

  it('looks up definitions by id', () => {
    const advanced = getFormatById('advanced');
    expect(advanced?.name).toBe('Advanced');
    expect(advanced?.poolRule).toBe('full-tcg');
    expect(advanced?.traditionalForbiddenAsLimited).toBe(false);
    expect(advanced?.sortDate).toBe('2026-02-02');
    expect(advanced?.sortDateSource).toContain('yugioh-card.com/en/limited/list_2026-02-02');

    const traditional = getFormatById('traditional');
    expect(traditional?.traditionalForbiddenAsLimited).toBe(true);
    expect(traditional?.sortDate).toBe('2026-02-02');
  });

  it('treats only catalog ids as known format params', () => {
    expect(isKnownFormatId('advanced')).toBe(true);
    expect(isKnownFormatId('tcg')).toBe(false);
    expect(isKnownFormatId('')).toBe(false);
  });

  it('formats display names from the catalog', () => {
    expect(formatDisplayName('traditional')).toBe('Traditional');
  });
});

describe('formatSortDateLabel', () => {
  it('formats catalog sort dates for display', () => {
    expect(formatCatalogSortDateLabel('2026-02-02')).toBe('Feb 2, 2026');
    expect(formatCatalogSortDateLabel(undefined)).toBeNull();
    expect(formatCatalogSortDateLabel('not-a-date')).toBeNull();
  });
});
