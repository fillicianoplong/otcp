import type { YugiohCard } from '../shared/schema/card.ts';
import { getFormatById, normalizeFormatId } from './formatCatalog.ts';

/** Whether a published card belongs to the format's card pool (FR-13). */
export function isCardInFormatPool(
  _card: YugiohCard,
  formatParam: string | null | undefined,
): boolean {
  const formatId = normalizeFormatId(formatParam);
  if (!formatId) return true;

  const format = getFormatById(formatId);
  if (!format) return true;

  switch (format.poolRule) {
    case 'full-tcg':
      return true;
    default:
      return true;
  }
}
