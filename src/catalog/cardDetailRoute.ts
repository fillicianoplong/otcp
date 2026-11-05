import { defaultArtId, resolveArtIds, resolveSelectedArtId } from './cardArt.ts';
import type { CatalogDerived } from './catalogDerived.ts';
import {
  fetchYgoproArtIdsForPasscodes,
  fetchYgoproCardRow,
  mapYgoproArtIds,
} from './ygoproArtIds.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

export type ResolvedCardDetailRoute = {
  card: YugiohCard;
  selectedArtId: number;
};

export function resolveSelectedArtFromRouteId(card: YugiohCard, routeId: number): number {
  if (routeId === card.id) return defaultArtId(card);
  return resolveSelectedArtId(card, routeId);
}

export function findCatalogCardByRouteId(
  derived: CatalogDerived,
  routeId: number,
): ResolvedCardDetailRoute | null {
  const direct = derived.cardById.get(routeId);
  if (direct) {
    return { card: direct, selectedArtId: resolveSelectedArtFromRouteId(direct, routeId) };
  }

  const ownerId = derived.cardIdByArtId.get(routeId);
  if (ownerId != null) {
    const card = derived.cardById.get(ownerId);
    if (card) {
      return { card, selectedArtId: routeId };
    }
  }

  for (const card of derived.cards) {
    const artIds = resolveArtIds(card);
    if (artIds.includes(routeId)) {
      return { card, selectedArtId: routeId };
    }
  }

  return null;
}

/** Resolve a detail URL passcode that is not a primary catalog card id (e.g. alternate artwork). */
export async function resolveCardDetailRouteUnknownId(
  derived: CatalogDerived,
  routeId: number,
): Promise<ResolvedCardDetailRoute | undefined> {
  await fetchYgoproArtIdsForPasscodes([routeId]);
  const cached = findCatalogCardByRouteId(derived, routeId);
  if (cached) return cached;

  const row = await fetchYgoproCardRow(routeId);
  if (!row) return undefined;

  await fetchYgoproArtIdsForPasscodes([row.id]);
  const afterRow = findCatalogCardByRouteId(derived, routeId);
  if (afterRow) return afterRow;

  const artIds = mapYgoproArtIds(row);
  if (derived.cardById.has(row.id)) {
    const card = derived.cardById.get(row.id)!;
    return {
      card,
      selectedArtId: artIds.includes(routeId)
        ? routeId
        : resolveSelectedArtFromRouteId(card, routeId),
    };
  }

  const nameMatches = derived.cards.filter((card) => card.name === row.name);
  if (nameMatches.length === 1) {
    const card = nameMatches[0]!;
    await fetchYgoproArtIdsForPasscodes([card.id]);
    return {
      card,
      selectedArtId: resolveSelectedArtFromRouteId(card, routeId),
    };
  }

  return undefined;
}
