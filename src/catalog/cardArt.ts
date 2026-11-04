import {
  publicBaseUrlFromPublishedImageUrl,
  publishedDefaultArtPaths,
  publishedImagePathsByImageId,
  R2_CARD_IMAGES_PUBLIC_BASE_URL,
} from '../shared/cardImageUrls.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

export type CatalogArtTile = {
  card: YugiohCard;
  imageId: number;
};

export function resolveArtIds(card: Pick<YugiohCard, 'id' | 'artIds'>): number[] {
  if (card.artIds && card.artIds.length > 0) {
    return card.artIds;
  }
  return [card.id];
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

export function expandCardsToArtTiles(
  cards: readonly YugiohCard[],
  allArtworks: boolean,
): CatalogArtTile[] {
  if (!allArtworks) {
    return cards.map((card) => ({ card, imageId: defaultArtId(card) }));
  }
  const tiles: CatalogArtTile[] = [];
  for (const card of cards) {
    for (const imageId of resolveArtIds(card)) {
      tiles.push({ card, imageId });
    }
  }
  return tiles;
}

export function catalogResultCount(
  matchingCardCount: number,
  visibleTiles: readonly CatalogArtTile[],
  allArtworks: boolean,
): number {
  return allArtworks ? visibleTiles.length : matchingCardCount;
}
