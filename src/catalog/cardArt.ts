import {
  publicBaseUrlFromPublishedImageUrl,
  publishedDefaultArtPaths,
  publishedImagePathsByImageId,
  R2_CARD_IMAGES_PUBLIC_BASE_URL,
} from '../shared/cardImageUrls.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { setArtPrintingsForCard } from './setArtPrintings.ts';
import { readCachedYgoproArtIds } from './ygoproArtIds.ts';

export type CatalogArtTile = {
  card: YugiohCard;
  imageId: number;
};

function curatedArtIdsForCard(cardId: number): number[] {
  const entry = setArtPrintingsForCard(cardId);
  if (!entry) return [];
  return Object.keys(entry.byImageId)
    .map((key) => Number.parseInt(key, 10))
    .filter((id) => Number.isFinite(id));
}

export function resolveArtIds(card: Pick<YugiohCard, 'id' | 'artIds'>): number[] {
  const fromCard = card.artIds && card.artIds.length > 0 ? [...card.artIds] : [card.id];
  const curated = curatedArtIdsForCard(card.id);
  const fromYgopro = readCachedYgoproArtIds(card.id);
  const ygoproList = fromYgopro && fromYgopro.length > 0 ? [...fromYgopro] : [];
  if (curated.length === 0 && ygoproList.length === 0) return fromCard;

  const merged = new Set<number>([...fromCard, ...curated, ...ygoproList]);
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
