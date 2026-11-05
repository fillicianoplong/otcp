import manifestJson from './data/tcg/manifest.json' with { type: 'json' };

export type TcgBanlistManifestEntry = {
  readonly effectiveDate: string;
  readonly effectiveThrough?: string;
  readonly listName: string;
  readonly pageTitle: string;
  readonly yugipediaUrl: string;
  readonly counts: {
    readonly forbidden: number;
    readonly limited: number;
    readonly 'semi-limited': number;
  };
  readonly gapCount: number;
};

export type TcgBanlistManifest = {
  readonly retrieved: string;
  readonly lineage: string;
  readonly sources: readonly {
    readonly name: string;
    readonly url: string;
    readonly statement?: string;
  }[];
  readonly lists: readonly TcgBanlistManifestEntry[];
  readonly gaps: readonly {
    readonly effectiveDate?: string;
    readonly name: string;
    readonly status: string;
    readonly pageTitle?: string;
  }[];
};

const manifest = manifestJson as TcgBanlistManifest;

const manifestByDate = new Map(manifest.lists.map((entry) => [entry.effectiveDate, entry]));

export function getTcgBanlistManifest(): TcgBanlistManifest {
  return manifest;
}

export function listTcgBanlistManifestEntriesNewestFirst(): readonly TcgBanlistManifestEntry[] {
  return [...manifest.lists].sort((left, right) =>
    right.effectiveDate.localeCompare(left.effectiveDate),
  );
}

export function getTcgBanlistManifestEntry(
  effectiveDate: string,
): TcgBanlistManifestEntry | undefined {
  return manifestByDate.get(effectiveDate);
}

export function getPreviousTcgBanlistEffectiveDate(effectiveDate: string): string | undefined {
  const chronological = [...manifest.lists].sort((a, b) =>
    a.effectiveDate.localeCompare(b.effectiveDate),
  );
  const index = chronological.findIndex((entry) => entry.effectiveDate === effectiveDate);
  if (index <= 0) return undefined;
  return chronological[index - 1]?.effectiveDate;
}

export function tcgBanlistDetailPath(effectiveDate: string): string {
  return `/banlists/${effectiveDate}`;
}

export function isKnownTcgBanlistDate(param: string | null | undefined): boolean {
  if (!param) return false;
  return manifestByDate.has(param.trim());
}

export type TcgBanlistStatusTotals = {
  readonly forbidden: number;
  readonly limited: number;
  readonly 'semi-limited': number;
};

export function tcgBanlistStatusTotals(entry: TcgBanlistManifestEntry): TcgBanlistStatusTotals {
  return entry.counts;
}

export type TcgBanlistTotalsDelta = {
  readonly forbidden: number;
  readonly limited: number;
  readonly 'semi-limited': number;
};

export function tcgBanlistTotalsDelta(
  current: TcgBanlistStatusTotals,
  previous: TcgBanlistStatusTotals | undefined,
): TcgBanlistTotalsDelta {
  if (!previous) {
    return { forbidden: 0, limited: 0, 'semi-limited': 0 };
  }
  return {
    forbidden: current.forbidden - previous.forbidden,
    limited: current.limited - previous.limited,
    'semi-limited': current['semi-limited'] - previous['semi-limited'],
  };
}

export function localTodayIsoDate(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function isTcgBanlistInForce(
  entry: TcgBanlistManifestEntry,
  todayIso = localTodayIsoDate(),
): boolean {
  if (entry.effectiveDate > todayIso) return false;
  if (!entry.effectiveThrough) {
    return entry.effectiveDate === newestInForceCandidate(todayIso)?.effectiveDate;
  }
  return entry.effectiveThrough >= todayIso;
}

function newestInForceCandidate(todayIso: string): TcgBanlistManifestEntry | undefined {
  const chronological = [...manifest.lists].sort((a, b) =>
    a.effectiveDate.localeCompare(b.effectiveDate),
  );
  let candidate: TcgBanlistManifestEntry | undefined;
  for (const entry of chronological) {
    if (entry.effectiveDate > todayIso) break;
    if (entry.effectiveThrough && entry.effectiveThrough < todayIso) continue;
    candidate = entry;
  }
  return candidate;
}

export function formatTcgBanlistUntilLabel(
  entry: TcgBanlistManifestEntry,
  inForce = isTcgBanlistInForce(entry),
): string {
  if (inForce) return 'In force';
  if (entry.effectiveThrough) return `Until ${entry.effectiveThrough}`;
  return 'Until present';
}

export function formatSignedDelta(delta: number): string {
  if (delta === 0) return '±0';
  if (delta > 0) return `+${delta}`;
  return `−${Math.abs(delta)}`;
}

/** Text color for list-size change vs the previous list (+ green, − red). */
export function banlistDeltaToneClass(delta: number): string {
  if (delta > 0) return 'text-emerald-700';
  if (delta < 0) return 'text-red-700';
  return 'text-text-3';
}

export const FORMAT_TCG_BANLIST_DATES: Readonly<
  Record<'goat' | 'hat' | 'tengu' | 'edison', string>
> = {
  goat: '2005-04-01',
  hat: '2014-04-01',
  tengu: '2011-09-01',
  edison: '2010-03-01',
};
