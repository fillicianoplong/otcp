import type { YugiohCard } from '../shared/schema/card.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import { lookupSetIndexEntry } from '../shared/schema/setIndexLookup.ts';

export type EarliestTcgReleaseResult =
  { kind: 'date'; isoDate: string } | { kind: 'missing' } | { kind: 'unparseable'; raw: string };

function parseIsoDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const time = Date.parse(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(time)) return null;
  return trimmed;
}

/** Earliest TCG set release date for a card from its printings and the published set index. */
export function earliestTcgReleaseForCard(
  card: YugiohCard,
  setIndex: SetIndex | null | undefined,
): EarliestTcgReleaseResult {
  if (!setIndex || card.sets.length === 0) {
    return { kind: 'missing' };
  }

  let earliest: string | null = null;
  for (const printing of card.sets) {
    const raw = lookupSetIndexEntry(setIndex, printing.setName)?.tcgDate?.trim();
    if (!raw) continue;
    const iso = parseIsoDate(raw);
    if (!iso) {
      return { kind: 'unparseable', raw };
    }
    if (earliest === null || iso < earliest) {
      earliest = iso;
    }
  }

  if (earliest === null) {
    return { kind: 'missing' };
  }
  return { kind: 'date', isoDate: earliest };
}

export function isEarliestReleaseOnOrBefore(
  release: EarliestTcgReleaseResult,
  cutoffIsoDate: string,
): boolean {
  if (release.kind === 'date') {
    return release.isoDate <= cutoffIsoDate;
  }
  return false;
}
