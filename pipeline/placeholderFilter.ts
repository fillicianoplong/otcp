import type { YgoApiCard } from './ygoprodeckTypes.ts';

/** YGOPRODeck profile placeholders (e.g. unrevealed tournament slots), not real cards. */
export const YGOPRODECK_PLACEHOLDER_CARD_IDS: readonly number[] = [149694341];

const PLACEHOLDER_CARD_ID_SET = new Set<number>(YGOPRODECK_PLACEHOLDER_CARD_IDS);

/** Matches YGOPRODeck placeholder card text (e.g. id 149694341 "???"). */
const PLACEHOLDER_DESC_PATTERN = /this card is used as a placeholder/i;

export function isYgoprodeckPlaceholderRow(card: YgoApiCard): boolean {
  if (PLACEHOLDER_CARD_ID_SET.has(card.id)) return true;
  const text = (card.desc ?? '').replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  return PLACEHOLDER_DESC_PATTERN.test(text);
}
