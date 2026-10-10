import lookupJson from './data/tcgBanlistLookup.generated.json' with { type: 'json' };

import type { BanDisplayStatus } from '../catalog/formatBanContext.ts';

type BanlistLookup = Readonly<Record<string, Readonly<Record<string, string>>>>;

const lookup = lookupJson as BanlistLookup;

const statusByDate = new Map<string, ReadonlyMap<number, BanDisplayStatus>>();

function toBanDisplayStatus(raw: string): BanDisplayStatus | null {
  switch (raw) {
    case 'forbidden':
      return 'Forbidden';
    case 'limited':
      return 'Limited';
    case 'semi-limited':
      return 'Semi-Limited';
    default:
      return null;
  }
}

function statusMapForDate(
  effectiveDate: string,
): ReadonlyMap<number, BanDisplayStatus> | undefined {
  let cached = statusByDate.get(effectiveDate);
  if (cached) return cached;

  const raw = lookup[effectiveDate];
  if (!raw) return undefined;

  const map = new Map<number, BanDisplayStatus>();
  for (const [id, status] of Object.entries(raw)) {
    const display = toBanDisplayStatus(status);
    if (display) {
      map.set(Number(id), display);
    }
  }
  cached = map;
  statusByDate.set(effectiveDate, cached);
  return cached;
}

export function resolveTcgDatedBanStatus(
  effectiveDate: string,
  cardId: number,
): BanDisplayStatus | null {
  const map = statusMapForDate(effectiveDate);
  return map?.get(cardId) ?? null;
}

export function isKnownTcgDatedBanlistDate(effectiveDate: string): boolean {
  return lookup[effectiveDate] != null;
}
