import { resolveArtIds, resolveSelectedArtId } from '../catalog/cardArt.ts';
import { catalogGridTileAriaLabel } from '../catalog/catalogArtTileLabel.ts';
import type { DeckCover } from '../deckStore/types.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

export type DeckCoverSource = {
  main: readonly number[];
  extra: readonly number[];
  side: readonly number[];
  skillId?: number | null;
  cover?: DeckCover | null;
};

export type DeckCoverOption = {
  cardId: number;
  artId: number;
  label: string;
};

/** Card ids in list order: main, extra, side, then skill. Copies collapse to one id. */
export function uniqueDeckCardIds(deck: DeckCoverSource): number[] {
  const ids: number[] = [];
  const seen = new Set<number>();
  const push = (id: number) => {
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) {
      return;
    }
    seen.add(id);
    ids.push(id);
  };

  for (const id of deck.main) push(id);
  for (const id of deck.extra) push(id);
  for (const id of deck.side) push(id);
  if (deck.skillId != null) push(deck.skillId);
  return ids;
}

/**
 * Cover to paint on the list card. A stored choice wins while that card is
 * still in the deck; otherwise the first card is the front. Empty decks return null.
 */
export function resolveDisplayedCover(
  deck: DeckCoverSource,
  cardsById?: ReadonlyMap<number, Pick<YugiohCard, 'id' | 'artIds'>>,
): DeckCover | null {
  const ids = uniqueDeckCardIds(deck);
  if (ids.length === 0) {
    return null;
  }

  const stored = deck.cover ?? null;
  const cardId = stored && ids.includes(stored.cardId) ? stored.cardId : ids[0]!;
  const card = cardsById?.get(cardId);
  const requestedArt = stored && stored.cardId === cardId ? stored.artId : undefined;
  const artId = card ? resolveSelectedArtId(card, requestedArt) : (requestedArt ?? cardId);
  return { cardId, artId };
}

/** One option per artwork on each card still in the deck. */
export function listDeckCoverOptions(
  deck: DeckCoverSource,
  cardsById: ReadonlyMap<number, YugiohCard>,
): DeckCoverOption[] {
  const options: DeckCoverOption[] = [];
  for (const cardId of uniqueDeckCardIds(deck)) {
    const card = cardsById.get(cardId);
    const artIds = card ? resolveArtIds(card) : [cardId];
    for (const artId of artIds) {
      options.push({
        cardId,
        artId,
        label: card ? catalogGridTileAriaLabel(card, artId) : `Card ${cardId}`,
      });
    }
  }
  return options;
}
