import { getFormatById, normalizeFormatId } from '../format/formatCatalog.ts';
import { isCardInFormatPool } from '../format/formatPool.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';

export function filterCatalogIdsByFormatPool(
  ids: readonly number[],
  cardById: ReadonlyMap<number, YugiohCard>,
  formatParam: string | null | undefined,
  setIndex?: SetIndex | null,
): readonly number[] {
  const formatId = normalizeFormatId(formatParam);
  if (!formatId) return ids;

  const format = getFormatById(formatId);
  if (format?.poolRule === 'full-tcg') {
    return ids;
  }

  const filtered: number[] = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]!;
    const card = cardById.get(id);
    if (card && isCardInFormatPool(card, formatId, setIndex)) {
      filtered.push(id);
    }
  }
  return filtered;
}

export function visibleCardsFromPoolIds(
  ids: readonly number[],
  cardById: ReadonlyMap<number, YugiohCard>,
): YugiohCard[] {
  const out = new Array<YugiohCard>(ids.length);
  for (let i = 0; i < ids.length; i++) {
    const card = cardById.get(ids[i]!);
    if (card) out[i] = card;
  }
  return out;
}
