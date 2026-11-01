import type { YugiohCard } from '../shared/schema/card.ts';
import type { YugiohBanlistInfo } from '../shared/schema/yugioh.ts';

export const FORMAT_QUERY_KEY = 'format';

export type BanDisplayStatus = 'Forbidden' | 'Limited' | 'Semi-Limited';

type BanFieldKey = keyof Pick<YugiohBanlistInfo, 'banTcg' | 'banOcg' | 'banGoat'>;

export function isFormatBanContextActive(formatParam: string | null | undefined): boolean {
  return typeof formatParam === 'string' && formatParam.trim().length > 0;
}

function banFieldForFormat(formatParam: string): BanFieldKey {
  const normalized = formatParam.trim().toLowerCase();
  if (normalized === 'ocg') return 'banOcg';
  if (normalized === 'goat') return 'banGoat';
  return 'banTcg';
}

/** Returns a visible ban status for list/grid overlays, or null when Unlimited or no format context. */
export function resolveCardBanForFormat(
  card: YugiohCard,
  formatParam: string | null | undefined,
): BanDisplayStatus | null {
  if (!isFormatBanContextActive(formatParam)) return null;
  const field = banFieldForFormat(formatParam!);
  const status = card.banlistInfo?.[field];
  if (!status) return null;
  return status;
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
