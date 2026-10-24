import type { YugiohCard } from '../shared/schema/card.ts';
import {
  catalogLargeImageUrl,
  catalogSmallImageUrl,
  resolveSelectedArtId,
} from '../catalog/cardArt.ts';
import { ygoprodeckLargeImageUrl, ygoprodeckSmallImageUrl } from '../shared/cardImageUrls.ts';

/** Typical YGOPRODeck / R2 card JPEG dimensions (large WebP keeps this aspect). */
export const YGO_CARD_ART_WIDTH = 421;
export const YGO_CARD_ART_HEIGHT = 614;

/** Tailwind aspect-ratio for frames that should match undistorted card art. */
export const YGO_CARD_ART_ASPECT_CLASS = 'aspect-[421/614]';

/** Detail art prefers full-size R2 URLs from the published dataset. */
export function cardDetailImageSrc(card: YugiohCard, selectedArtId?: number): string {
  const artId = resolveSelectedArtId(card, selectedArtId);
  if (artId === card.id) {
    return card.images.large;
  }
  return catalogLargeImageUrl(card, artId);
}

export function cardDetailImageFallback(
  card: YugiohCard,
  currentSrc: string,
  selectedArtId?: number,
): string | undefined {
  const artId = resolveSelectedArtId(card, selectedArtId);
  const hostedSmall = catalogSmallImageUrl(card, artId);
  const hostedLarge = catalogLargeImageUrl(card, artId);
  const ygoproSmall = ygoprodeckSmallImageUrl(artId);
  const ygoproLarge = ygoprodeckLargeImageUrl(artId);

  if (currentSrc === hostedLarge && hostedSmall !== hostedLarge) {
    return hostedSmall;
  }
  if (currentSrc === hostedSmall && currentSrc !== ygoproSmall) {
    return ygoproSmall;
  }
  if (currentSrc === ygoproSmall && currentSrc !== ygoproLarge) {
    return ygoproLarge;
  }
  if (artId === card.id && currentSrc !== card.images.small && card.images.small.length > 0) {
    return card.images.small;
  }
  return undefined;
}
