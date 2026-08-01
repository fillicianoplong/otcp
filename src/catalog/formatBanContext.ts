import type { YugiohCard } from '../shared/schema/card.ts';
import { isKnownFormatId } from '../format/formatCatalog.ts';
import { resolveFormatBanStatus } from '../format/formatBanStatus.ts';

export const FORMAT_QUERY_KEY = 'format';

export type BanDisplayStatus = 'Forbidden' | 'Limited' | 'Semi-Limited';

export function isFormatBanContextActive(formatParam: string | null | undefined): boolean {
  return isKnownFormatId(formatParam);
}

/** Returns a visible ban status for list/grid overlays, or null when Unlimited or no format context. */
export function resolveCardBanForFormat(
  card: YugiohCard,
  formatParam: string | null | undefined,
): BanDisplayStatus | null {
  if (!isFormatBanContextActive(formatParam)) return null;
  return resolveFormatBanStatus(card, formatParam);
}

export function banMarkerForStatus(status: BanDisplayStatus): {
  glyph: string;
  label: string;
  colorClass: string;
} {
  switch (status) {
    case 'Limited':
      return { glyph: '1', label: 'Limited', colorClass: 'text-ban-limited' };
    case 'Semi-Limited':
      return { glyph: '2', label: 'Semi-Limited', colorClass: 'text-ban-semi' };
    case 'Forbidden':
      return { glyph: '⊘', label: 'Forbidden', colorClass: 'text-ban-forbidden' };
    default:
      return { glyph: '?', label: status, colorClass: 'text-text-2' };
  }
}
