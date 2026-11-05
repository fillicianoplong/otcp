import { useEffect, useMemo, useState } from 'react';

import { resolveArtIds } from './cardArt.ts';
import { fetchYgoproArtIdsForPasscodes } from './ygoproArtIds.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

function needsYgoproArtLookup(card: YugiohCard): boolean {
  return resolveArtIds(card).length <= 1;
}

function mergeArtIdsOntoCard(card: YugiohCard, artIds: readonly number[] | undefined): YugiohCard {
  if (!artIds || artIds.length <= 1) return card;
  if (
    card.artIds &&
    card.artIds.length === artIds.length &&
    card.artIds.every((id, i) => id === artIds[i])
  ) {
    return card;
  }
  return { ...card, artIds: [...artIds] };
}

/** When All artworks is on, backfill missing `artIds` from YGOPRODeck for visible cards. */
export function useArtworkEnrichedCards(
  cards: readonly YugiohCard[],
  allArtworks: boolean,
): YugiohCard[] {
  const [artIdsByCardId, setArtIdsByCardId] = useState<Map<number, readonly number[]>>(
    () => new Map(),
  );

  const lookupKey = useMemo(() => {
    if (!allArtworks) return '';
    return cards
      .filter(needsYgoproArtLookup)
      .map((card) => card.id)
      .sort((left, right) => left - right)
      .join(',');
  }, [allArtworks, cards]);

  useEffect(() => {
    if (!allArtworks || lookupKey.length === 0) {
      queueMicrotask(() => setArtIdsByCardId(new Map()));
      return;
    }

    const passcodes = lookupKey.split(',').map((raw) => Number.parseInt(raw, 10));
    let cancelled = false;

    void fetchYgoproArtIdsForPasscodes(passcodes).then((fetched) => {
      if (cancelled) return;
      setArtIdsByCardId((previous) => {
        const next = new Map(previous);
        for (const [id, artIds] of fetched) {
          if (artIds.length > 1) next.set(id, artIds);
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [allArtworks, lookupKey]);

  return useMemo(
    () =>
      cards.map((card) => mergeArtIdsOntoCard(card, artIdsByCardId.get(card.id) ?? card.artIds)),
    [artIdsByCardId, cards],
  );
}
