import { useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';

import {
  findCatalogCardByRouteId,
  resolveCardDetailRouteUnknownId,
} from '../catalog/cardDetailRoute.ts';
import { getCatalogDerived } from '../catalog/catalogDerived.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import { getGuestDeckDraft, subscribeGuestDeckDrafts } from '../deckStore/guestDeckDraftStore.ts';
import {
  cardRouteIdFromPathname,
  deckDraftIdFromPathname,
  documentTitleForRoute,
} from '../documentTitle.ts';

function useCardRouteDisplayName(pathname: string): string | null {
  const cardId = cardRouteIdFromPathname(pathname);
  const { state } = useCardCatalog();
  const cards = state.status === 'ready' ? state.cards : null;

  const syncName = useMemo(() => {
    if (cardId == null || cards == null) return null;
    return findCatalogCardByRouteId(getCatalogDerived(cards), cardId)?.card.name ?? null;
  }, [cardId, cards]);

  const [asyncMatch, setAsyncMatch] = useState<{ id: number; name: string | null } | null>(null);

  useEffect(() => {
    if (cardId == null || cards == null || syncName != null) return undefined;
    let cancelled = false;
    void resolveCardDetailRouteUnknownId(getCatalogDerived(cards), cardId).then((resolved) => {
      if (cancelled) return;
      setAsyncMatch({ id: cardId, name: resolved?.card.name ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [cardId, cards, syncName]);

  if (cardId == null) return null;
  if (syncName != null) return syncName;
  if (asyncMatch?.id === cardId) return asyncMatch.name;
  return null;
}

function deckNameSnapshot(draftId: string | null): string | null {
  if (draftId == null) return null;
  return getGuestDeckDraft(draftId)?.name ?? null;
}

function useDeckRouteName(pathname: string): string | null {
  const draftId = deckDraftIdFromPathname(pathname);
  return useSyncExternalStore(
    subscribeGuestDeckDrafts,
    () => deckNameSnapshot(draftId),
    () => deckNameSnapshot(draftId),
  );
}

/** Keeps `document.title` aligned with the current route, including client navigations. */
export function DocumentTitle() {
  const { pathname } = useLocation();
  const cardName = useCardRouteDisplayName(pathname);
  const deckName = useDeckRouteName(pathname);
  const title = documentTitleForRoute({ pathname, cardName, deckName });

  useLayoutEffect(() => {
    document.title = title;
  }, [title]);

  return null;
}
