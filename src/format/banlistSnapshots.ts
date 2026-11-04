import type { BanDisplayStatus } from '../catalog/formatBanContext.ts';
import type { FormatId } from './formatCatalog.ts';
import goatJson from './data/goat.json' with { type: 'json' };
import hatJson from './data/hat.json' with { type: 'json' };
import tenguJson from './data/tengu.json' with { type: 'json' };
import edisonJson from './data/edison.json' with { type: 'json' };
import {
  formatBanlistSnapshotSchema,
  type BanlistSnapshotCard,
  type FormatBanlistSnapshot,
} from './banlistSnapshotSchema.ts';

const SNAPSHOT_FORMAT_IDS = ['goat', 'hat', 'tengu', 'edison'] as const;
export type BanlistSnapshotFormatId = (typeof SNAPSHOT_FORMAT_IDS)[number];

function parseSnapshot(raw: unknown): FormatBanlistSnapshot {
  return formatBanlistSnapshotSchema.parse(raw);
}

const RAW_SNAPSHOTS: Record<BanlistSnapshotFormatId, FormatBanlistSnapshot> = {
  goat: parseSnapshot(goatJson),
  hat: parseSnapshot(hatJson),
  tengu: parseSnapshot(tenguJson),
  edison: parseSnapshot(edisonJson),
};

type SnapshotIndex = {
  readonly snapshot: FormatBanlistSnapshot;
  readonly byId: ReadonlyMap<number, BanlistSnapshotCard>;
  readonly byPasscode: ReadonlyMap<string, BanlistSnapshotCard>;
};

function normalizePasscodeKey(passcode: string): string {
  const trimmed = passcode.trim();
  const withoutLeadingZeros = trimmed.replace(/^0+/, '') || '0';
  return withoutLeadingZeros;
}

function buildIndex(snapshot: FormatBanlistSnapshot): SnapshotIndex {
  const byId = new Map<number, BanlistSnapshotCard>();
  const byPasscode = new Map<string, BanlistSnapshotCard>();
  for (const card of snapshot.cards) {
    byId.set(card.id, card);
    byPasscode.set(normalizePasscodeKey(card.passcode), card);
    byPasscode.set(String(card.id), card);
  }
  return { snapshot, byId, byPasscode };
}

const snapshotIndexByFormat = new Map<BanlistSnapshotFormatId, SnapshotIndex>(
  SNAPSHOT_FORMAT_IDS.map((id) => [id, buildIndex(RAW_SNAPSHOTS[id])]),
);

export function isBanlistSnapshotFormatId(formatId: FormatId): formatId is BanlistSnapshotFormatId {
  return (SNAPSHOT_FORMAT_IDS as readonly string[]).includes(formatId);
}

export function getFormatBanlistSnapshot(formatId: BanlistSnapshotFormatId): FormatBanlistSnapshot {
  return RAW_SNAPSHOTS[formatId];
}

export function snapshotCardToBanStatus(status: BanlistSnapshotCard['status']): BanDisplayStatus {
  switch (status) {
    case 'forbidden':
      return 'Forbidden';
    case 'limited':
      return 'Limited';
    case 'semi-limited':
      return 'Semi-Limited';
  }
}

export function lookupBanlistSnapshotCard(
  formatId: BanlistSnapshotFormatId,
  options: { cardId?: number; passcode?: string | number | null },
): BanlistSnapshotCard | undefined {
  const index = snapshotIndexByFormat.get(formatId);
  if (!index) return undefined;

  if (options.cardId != null) {
    const byId = index.byId.get(options.cardId);
    if (byId) return byId;
  }

  if (options.passcode != null && options.passcode !== '') {
    const key =
      typeof options.passcode === 'number'
        ? String(options.passcode)
        : normalizePasscodeKey(options.passcode);
    return index.byPasscode.get(key);
  }

  return undefined;
}

export function resolveSnapshotBanStatus(
  formatId: BanlistSnapshotFormatId,
  cardId: number,
  passcode: number | undefined,
): BanDisplayStatus | null {
  const row = lookupBanlistSnapshotCard(formatId, { cardId, passcode });
  if (!row) return null;
  return snapshotCardToBanStatus(row.status);
}
