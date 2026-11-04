import { resolveArtIds } from './cardArt.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

/** Default-art gallery tile: accessible name is exactly the card name. */
export function catalogGridTileAriaLabel(card: YugiohCard, imageId: number): string {
  const artIds = resolveArtIds(card);
  const index = artIds.indexOf(imageId);
  if (index <= 0) {
    return card.name;
  }
  return `${card.name}, artwork ${index + 1} of ${artIds.length}`;
}

export function catalogArtVariantIndex(card: YugiohCard, imageId: number): number {
  const artIds = resolveArtIds(card);
  const index = artIds.indexOf(imageId);
  return index >= 0 ? index + 1 : 1;
}

export function catalogArtVariantCount(card: YugiohCard): number {
  return resolveArtIds(card).length;
}
