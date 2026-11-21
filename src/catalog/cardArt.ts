import {
  publicBaseUrlFromPublishedImageUrl,
  publishedDefaultArtPaths,
  publishedImagePathsByImageId,
  R2_CARD_IMAGES_PUBLIC_BASE_URL,
} from '../shared/cardImageUrls.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import type { FilterState } from './filterEngine.ts';
import { artIdsPrintedInSets } from './setArtPrintings.ts';
import { readCachedYgoproArtIds } from './ygoproArtIds.ts';

export type CatalogArtTile = {
  card: YugiohCard;
  imageId: number;
};

export function resolveArtIds(card: Pick<YugiohCard, 'id' | 'artIds'>): number[] {
  const fromCard = card.artIds && card.artIds.length > 0 ? [...card.artIds] : [card.id];
  const fromYgopro = readCachedYgoproArtIds(card.id);
  const ygoproList = fromYgopro && fromYgopro.length > 0 ? [...fromYgopro] : [];
  if (ygoproList.length === 0) return fromCard;

  const merged = new Set<number>([...fromCard, ...ygoproList]);
  const primary = fromCard[0] ?? card.id;
  const rest = [...merged].filter((id) => id !== primary).sort((left, right) => left - right);
  return [primary, ...rest];
}

export function defaultArtId(card: Pick<YugiohCard, 'id' | 'artIds'>): number {
  return resolveArtIds(card)[0] ?? card.id;
}

export function resolveSelectedArtId(
  card: Pick<YugiohCard, 'id' | 'artIds'>,
  requestedArtId: number | null | undefined,
): number {
  const artIds = resolveArtIds(card);
  if (requestedArtId != null && artIds.includes(requestedArtId)) {
    return requestedArtId;
  }
  return defaultArtId(card);
}

export function usesDefaultArtObjectKey(cardId: number, imageId: number): boolean {
  return imageId === cardId;
}

export function catalogImageBaseUrl(card: YugiohCard): string {
  const fromLarge = card.images.large;
  if (fromLarge.length > 0) {
    return publicBaseUrlFromPublishedImageUrl(fromLarge);
  }
  return R2_CARD_IMAGES_PUBLIC_BASE_URL;
}

export function catalogSmallImageUrl(card: YugiohCard, imageId: number): string {
  const base = catalogImageBaseUrl(card);
  if (usesDefaultArtObjectKey(card.id, imageId)) {
    return publishedDefaultArtPaths(card.id, base).small;
  }
  return publishedImagePathsByImageId(imageId, base).small;
}

export function catalogLargeImageUrl(card: YugiohCard, imageId: number): string {
  const base = catalogImageBaseUrl(card);
  if (usesDefaultArtObjectKey(card.id, imageId)) {
    return publishedDefaultArtPaths(card.id, base).large;
  }
  return publishedImagePathsByImageId(imageId, base).large;
}

/** Set names picked in the Set filter, or an empty list when it is not in use. */
export function setFilterNames(filterState: FilterState | null | undefined): string[] {
  const include = filterState?.facets.set?.include;
  return include && include.length > 0 ? [...include] : [];
}

/**
 * Artworks to show for a card. With a Set filter, only the art printed in those sets is shown,
 * and the default art stands in when that printing's artwork is not known.
 */
export function artIdsForSets(
  card: Pick<YugiohCard, 'id' | 'artIds' | 'passcode'>,
  setNames: readonly string[] = [],
): number[] {
  const artIds = resolveArtIds(card);
  if (setNames.length === 0 || artIds.length <= 1) return artIds;
  const printed = artIdsPrintedInSets({ ...card, artIds }, new Set(setNames)).filter((id) =>
    artIds.includes(id),
  );
  return printed.length > 0 ? printed : [artIds[0] ?? card.id];
}

export function expandCardsToArtTiles(
  cards: readonly YugiohCard[],
  setNames: readonly string[] = [],
): CatalogArtTile[] {
  const tiles: CatalogArtTile[] = [];
  for (const card of cards) {
    for (const imageId of artIdsForSets(card, setNames)) {
      tiles.push({ card, imageId });
    }
  }
  return tiles;
}

export function catalogResultCount(visibleTiles: readonly CatalogArtTile[]): number {
  return visibleTiles.length;
}
