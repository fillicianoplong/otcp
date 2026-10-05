import type { YugiohCard } from '../shared/schema/card.ts';
import {
  canAddCardToGenesysDeck,
  genesysRefusalReasonForCard,
  isGenesysFormat,
} from '../format/formatEngine/genesysRules.ts';
import { isCardInFormatPool } from '../format/formatPool.ts';
import { maxCopiesForCardInFormat } from '../format/formatBanStatus.ts';
import type { FormatId } from '../format/formatCatalog.ts';

export type DeckAddRefusalReason =
  'link-monster' | 'pendulum-monster' | 'outside-pool' | 'copy-limit';

export type DeckAddValidationResult = { ok: true } | { ok: false; reason: DeckAddRefusalReason };

function countCopies(cardId: number, sections: readonly (readonly number[])[]): number {
  let count = 0;
  for (const section of sections) {
    for (const id of section) {
      if (id === cardId) count += 1;
    }
  }
  return count;
}

export function validateDeckAdd(
  card: YugiohCard,
  formatId: FormatId,
  main: readonly number[],
  extra: readonly number[],
  side: readonly number[],
): DeckAddValidationResult {
  if (isGenesysFormat(formatId)) {
    const refusal = genesysRefusalReasonForCard(card);
    if (refusal) {
      return { ok: false, reason: refusal };
    }
    if (!canAddCardToGenesysDeck(card)) {
      return { ok: false, reason: 'link-monster' };
    }
  }

  if (!isCardInFormatPool(card, formatId)) {
    return { ok: false, reason: 'outside-pool' };
  }

  const maxCopies = maxCopiesForCardInFormat(card, formatId);
  const current = countCopies(card.id, [main, extra, side]);
  if (current >= maxCopies) {
    return { ok: false, reason: 'copy-limit' };
  }

  return { ok: true };
}

export function deckAddRefusalMessage(reason: DeckAddRefusalReason): string {
  switch (reason) {
    case 'link-monster':
      return 'Link Monsters are not allowed in Genesys.';
    case 'pendulum-monster':
      return 'Pendulum Monsters are not allowed in Genesys.';
    case 'outside-pool':
      return 'This card is outside the active format pool.';
    case 'copy-limit':
      return 'You already have the maximum copies of this card.';
    default:
      return 'This card cannot be added.';
  }
}
