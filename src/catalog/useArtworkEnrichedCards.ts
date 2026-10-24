import { useEffect, useMemo, useState } from 'react';

import { resolveArtIds } from './cardArt.ts';
import { fetchYgoproArtIdsForPasscodes, readCachedYgoproArtIds } from './ygoproArtIds.ts';
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

/** Backfill missing `artIds` from YGOPRODeck for the given cards (e.g. current search results). */
export function useArtworkEnrichedCards(
  cards: readonly YugiohCard[],
  artCacheRevision = 0,
): YugiohCard[] {
  const [artIdsByCardId, setArtIdsByCardId] = useState<Map<number, readonly number[]>>(
    () => new Map(),
  );

  const lookupKey = useMemo(() => {
    return cards
      .filter(needsYgoproArtLookup)
      .map((card) => card.id)
      .sort((left, right) => left - right)
      .join(',');
  }, [cards]);

  useEffect(() => {
    if (import.meta.env.VITE_DISABLE_CATALOG_ART_WARM === 'true') {
      queueMicrotask(() => setArtIdsByCardId(new Map()));
      return;
    }
    if (lookupKey.length === 0) {
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
  }, [lookupKey]);

  return useMemo(() => {
    return cards.map((card) => {
      const fromWarm = readCachedYgoproArtIds(card.id);
      const artIds =
        fromWarm && fromWarm.length > 1 ? fromWarm : (artIdsByCardId.get(card.id) ?? card.artIds);
      return mergeArtIdsOntoCard(card, artIds);
    });
  }, [artCacheRevision, artIdsByCardId, cards]);
}
