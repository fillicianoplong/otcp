import type { BanDisplayStatus } from '../catalog/formatBanContext.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { isBanlistSnapshotFormatId, resolveSnapshotBanStatus } from './banlistSnapshots.ts';
import { getFormatById, normalizeFormatId } from './formatCatalog.ts';

type TcgBanField = 'banTcg';

function tcgBanStatus(card: YugiohCard): BanDisplayStatus | undefined {
  return card.banlistInfo?.banTcg;
}

function tcgBanFieldForFormat(): TcgBanField {
  return 'banTcg';
}

/** Raw TCG list status before Traditional remapping. */
export function resolveAdvancedBanStatus(card: YugiohCard): BanDisplayStatus | null {
  const status = tcgBanStatus(card);
  return status ?? null;
}

/**
 * Ban status shown in UI for the active format, or null when Unlimited / no restriction marker.
 * Traditional maps Advanced Forbidden → Limited (FR-15).
 */
export function resolveFormatBanStatus(
  card: YugiohCard,
  formatParam: string | null | undefined,
): BanDisplayStatus | null {
  const formatId = normalizeFormatId(formatParam);
  if (!formatId) return null;

  const format = getFormatById(formatId);
  if (!format) return null;

  let raw: BanDisplayStatus | null;

  if (format.banlistSource === 'curated-snapshot' && isBanlistSnapshotFormatId(formatId)) {
    raw = resolveSnapshotBanStatus(formatId, card.id, card.passcode);
  } else {
    const field = tcgBanFieldForFormat();
    raw = card.banlistInfo?.[field] ?? null;
  }

  if (!raw) return null;

  if (format.traditionalForbiddenAsLimited && raw === 'Forbidden') {
    return 'Limited';
  }

  return raw;
}

/** Maximum deck copies allowed for a card under the active format banlist. */
export function maxCopiesForFormatBanStatus(status: BanDisplayStatus | null): number {
  if (!status) return 3;
  switch (status) {
    case 'Forbidden':
      return 0;
    case 'Limited':
      return 1;
    case 'Semi-Limited':
      return 2;
    default:
      return 3;
  }
}

export function maxCopiesForCardInFormat(
  card: YugiohCard,
  formatParam: string | null | undefined,
): number {
  return maxCopiesForFormatBanStatus(resolveFormatBanStatus(card, formatParam));
}
