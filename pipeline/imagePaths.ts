import { join } from 'node:path';

import { CARD_IMAGES_SUBDIR } from './constants.ts';

/** Browser-facing large art path (GitHub Pages base /otcp/). */
export function sameOriginLargePath(cardId: number): string {
  return `/otcp/${CARD_IMAGES_SUBDIR}/${cardId}.jpg`;
}

/** Browser-facing cropped/small art path. */
export function sameOriginSmallPath(cardId: number): string {
  return `/otcp/${CARD_IMAGES_SUBDIR}/small/${cardId}.jpg`;
}

export function sameOriginImagePaths(cardId: number): { small: string; large: string } {
  return { small: sameOriginSmallPath(cardId), large: sameOriginLargePath(cardId) };
}

/** Filesystem directory for re-hosted art under `public/card-images/`. */
export function publicCardImagesDir(repoRoot: string): string {
  return join(repoRoot, 'public', CARD_IMAGES_SUBDIR);
}

export function ygoprodeckLargeImageUrl(cardId: number): string {
  return `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`;
}

export function ygoprodeckSmallImageUrl(cardId: number): string {
  return `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`;
}
