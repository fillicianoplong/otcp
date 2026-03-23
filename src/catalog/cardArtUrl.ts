import type { YugiohCard } from '../shared/schema/card.ts';

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
