import { describe, expect, it } from 'vitest';

import { computeBanlistDiff } from '../../src/format/banlistDiff.ts';
import { buildTcgBanlistDetailPageModel } from '../../src/format/formatBanlistPageModel.ts';
import {
  getPreviousTcgBanlistEffectiveDate,
  getTcgBanlistManifest,
  isTcgBanlistInForce,
  listTcgBanlistManifestEntriesNewestFirst,
  loadTcgBanlistSnapshot,
  loadTcgBanlistSnapshotWithPrevious,
  tcgBanlistTotalsDelta,
  tcgBanlistStatusTotals,
} from '../../src/format/tcgBanlists.ts';

describe('TCG banlist manifest', () => {
  it('lists every Advanced TCG list from 2002-05-07 newest first', () => {
    const manifest = getTcgBanlistManifest();
    expect(manifest.lists.length).toBeGreaterThanOrEqual(80);
    const newestFirst = listTcgBanlistManifestEntriesNewestFirst();
    expect(
      newestFirst[0]?.effectiveDate.localeCompare(newestFirst[1]?.effectiveDate ?? ''),
    ).toBeGreaterThan(0);
    const oldest = newestFirst[newestFirst.length - 1];
    expect(oldest?.effectiveDate).toBe('2002-05-07');
  });

  it('marks exactly one in-force list for a date inside the current window', () => {
    const entries = listTcgBanlistManifestEntriesNewestFirst();
    const inForce = entries.filter((entry) => isTcgBanlistInForce(entry, '2026-11-04'));
    expect(inForce).toHaveLength(1);
  });
});

describe('TCG banlist snapshot diffs', () => {
  it('computes totals delta between adjacent lists', () => {
    const entries = listTcgBanlistManifestEntriesNewestFirst();
    const current = entries[0];
    const previous = entries[1];
    if (!current || !previous) throw new Error('expected at least two lists');
    const delta = tcgBanlistTotalsDelta(
      tcgBanlistStatusTotals(current),
      tcgBanlistStatusTotals(previous),
    );
    expect(delta.forbidden + delta.limited + delta['semi-limited']).toBeTypeOf('number');
  });

  it('derives previous list from manifest order for diffs', async () => {
    expect(getPreviousTcgBanlistEffectiveDate('2010-03-01')).toBe('2009-09-01');
    const pair = await loadTcgBanlistSnapshotWithPrevious('2010-03-01');
    expect(pair?.previousCards?.length).toBeGreaterThan(0);
    const diff = computeBanlistDiff(pair!.snapshot.cards, pair!.previousCards);
    expect(diff.badgesByCardId.size).toBeGreaterThan(0);
  });

  it('builds change sections from snapshot rows without the published catalog', async () => {
    const snapshot = await loadTcgBanlistSnapshot('2010-03-01');
    expect(snapshot).toBeDefined();
    const previousDate = getPreviousTcgBanlistEffectiveDate('2010-03-01');
    const previous = previousDate ? await loadTcgBanlistSnapshot(previousDate) : undefined;
    const model = buildTcgBanlistDetailPageModel(snapshot!, previous?.cards, []);
    expect(model.changeSections.length).toBeGreaterThan(0);
    expect(model.fullSections.length).toBe(3);
    expect(model.fullSections.every((section) => section.cards.length > 0)).toBe(true);
  });
});
