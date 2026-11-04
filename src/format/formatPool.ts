import type { YugiohCard } from '../shared/schema/card.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import {
  earliestTcgReleaseForCard,
  isEarliestReleaseOnOrBefore,
} from './cardEarliestTcgRelease.ts';
import { getFormatById, normalizeFormatId } from './formatCatalog.ts';

/** Whether a published card belongs to the format's card pool (FR-13). */
export function isCardInFormatPool(
  card: YugiohCard,
  formatParam: string | null | undefined,
  setIndex?: SetIndex | null,
): boolean {
  const formatId = normalizeFormatId(formatParam);
  if (!formatId) return true;

  const format = getFormatById(formatId);
  if (!format) return true;

  switch (format.poolRule) {
    case 'full-tcg':
      return true;
    case 'tcg-earliest-on-or-before': {
      const cutoff = format.poolCutoffDate;
      if (!cutoff) return true;
      const release = earliestTcgReleaseForCard(card, setIndex);
      return isEarliestReleaseOnOrBefore(release, cutoff);
    }
    default:
      return true;
  }
}
