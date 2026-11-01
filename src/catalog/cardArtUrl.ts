import type { YugiohCard } from '../shared/schema/card.ts';

/** Detail art URL when only small images are published on Pages. */
export function cardDetailImageSrc(card: YugiohCard): string {
  return card.images.small;
}

export function cardDetailImageFallback(card: YugiohCard, currentSrc: string): string | undefined {
  if (currentSrc !== card.images.small && card.images.small.length > 0) {
    return card.images.small;
  }
  return undefined;
}
