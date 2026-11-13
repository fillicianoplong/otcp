import { describe, expect, it } from 'vitest';

import {
  banlistChangeBadge,
  banlistStatusCopyLimit,
  computeBanlistDiff,
} from '../../src/format/banlistDiff.ts';
import type { BanlistSnapshotCard } from '../../src/format/banlistSnapshotSchema.ts';
import {
  getFormatBanlistPreviousList,
  getFormatBanlistSnapshot,
} from '../../src/format/banlistSnapshots.ts';

function row(
  id: number,
  status: BanlistSnapshotCard['status'],
  name = `Card ${id}`,
): BanlistSnapshotCard {
  return {
    id,
    passcode: String(id).padStart(8, '0'),
    name,
    status,
    note: '',
  };
}

describe('banlistStatusCopyLimit', () => {
  it('maps snapshot statuses to 0, 1, or 2 copy caps', () => {
    expect(banlistStatusCopyLimit('forbidden')).toBe(0);
    expect(banlistStatusCopyLimit('limited')).toBe(1);
    expect(banlistStatusCopyLimit('semi-limited')).toBe(2);
    expect(banlistStatusCopyLimit(undefined)).toBe(3);
  });
});

describe('banlistChangeBadge', () => {
  it('labels newly restricted cards', () => {
    expect(banlistChangeBadge(undefined, 'limited')).toBe('New!');
  });

  it('labels tier shifts with From N', () => {
    expect(banlistChangeBadge('limited', 'forbidden')).toBe('From 1');
    expect(banlistChangeBadge('semi-limited', 'limited')).toBe('From 2');
    expect(banlistChangeBadge('forbidden', 'limited')).toBe('From 0');
  });

  it('omits a badge when the status is unchanged', () => {
    expect(banlistChangeBadge('limited', 'limited')).toBeNull();
  });
});

describe('computeBanlistDiff', () => {
  it('returns empty diff when no previous snapshot exists', () => {
    const current = [row(1, 'forbidden'), row(2, 'limited')];
    expect(computeBanlistDiff(current, undefined)).toEqual({
      badgesByCardId: new Map(),
      noLongerRestricted: [],
    });
  });

  it('collects badges and cards that left the list', () => {
    const previous = [row(1, 'limited'), row(2, 'forbidden'), row(3, 'semi-limited')];
    const current = [row(1, 'forbidden'), row(4, 'limited')];
    const diff = computeBanlistDiff(current, previous);
    expect(diff.badgesByCardId.get(1)).toBe('From 1');
    expect(diff.badgesByCardId.get(4)).toBe('New!');
    expect(diff.noLongerRestricted.map((card) => card.id).sort()).toEqual([2, 3]);
  });
});

describe('curated snapshot previousList data', () => {
  it('loads lineage previous lists for GOAT, HAT, and Tengu', () => {
    for (const formatId of ['goat', 'hat', 'tengu'] as const) {
      const snapshot = getFormatBanlistSnapshot(formatId);
      const previous = getFormatBanlistPreviousList(formatId);
      expect(previous?.cards.length).toBeGreaterThan(0);
      expect(previous?.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const diff = computeBanlistDiff(snapshot.cards, previous?.cards);
      expect(diff.badgesByCardId.size).toBeGreaterThan(0);
    }
  });
});
