import type { YugiohCard } from '../shared/schema/card.ts';
import { publishedImagePaths } from '../shared/cardImageUrls.ts';
import type { BanlistSnapshotCard } from './banlistSnapshotSchema.ts';

function passcodeNumber(row: BanlistSnapshotCard): number {
  const raw = row.passcode;
  if (typeof raw === 'number') return raw;
  const parsed = Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? parsed : row.id;
}

/** Minimal catalog row for banlist grids when the published dataset is not loaded yet. */
export function yugiohCardPlaceholderFromBanlistRow(row: BanlistSnapshotCard): YugiohCard {
  const passcode = passcodeNumber(row);
  return {
    schemaVersion: '1.0.0',
    id: row.id,
    name: row.name,
    type: 'Unknown',
    text: '',
    images: publishedImagePaths(row.id),
    sets: [],
    passcode,
  };
}

export function resolveBanlistDisplayCard(
  row: BanlistSnapshotCard,
  catalogById: ReadonlyMap<number, YugiohCard>,
): YugiohCard {
  return catalogById.get(row.id) ?? yugiohCardPlaceholderFromBanlistRow(row);
}
