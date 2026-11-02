import type { YugiohCard } from '../shared/schema/card.ts';

/** Typical YGOPRODeck / R2 card JPEG dimensions (large WebP keeps this aspect). */
export const YGO_CARD_ART_WIDTH = 421;
export const YGO_CARD_ART_HEIGHT = 614;

/** Tailwind aspect-ratio for frames that should match undistorted card art. */
export const YGO_CARD_ART_ASPECT_CLASS = 'aspect-[421/614]';

/** Detail art prefers full-size R2 URLs from the published dataset. */
export function cardDetailImageSrc(card: YugiohCard): string {
  return card.images.large;
}

export function cardDetailImageFallback(card: YugiohCard, currentSrc: string): string | undefined {
  if (currentSrc !== card.images.small && card.images.small.length > 0) {
    return card.images.small;
  }
  return undefined;
}
