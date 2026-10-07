import { join } from 'node:path';

import { CARD_IMAGES_SUBDIR } from './constants.ts';
import {
  publicLargeImageUrl,
  publicSmallImageUrl,
  publishedDefaultArtPaths,
  publishedImagePaths,
  publishedImagePathsByImageId,
  r2LargeObjectKey,
  r2SmallObjectKey,
  R2_CARD_IMAGES_PUBLIC_BASE_URL,
} from '../src/shared/cardImageUrls.ts';

export {
  publicLargeImageUrl,
  publicSmallImageUrl,
  publishedDefaultArtPaths,
  publishedImagePaths,
  publishedImagePathsByImageId,
  r2LargeObjectKey,
  r2SmallObjectKey,
  R2_CARD_IMAGES_PUBLIC_BASE_URL,
};

/** @deprecated Small art is on R2; use {@link publicSmallImageUrl}. */
export function sameOriginSmallPath(cardId: number): string {
  return `/otcp/${CARD_IMAGES_SUBDIR}/small/${cardId}.jpg`;
}

export function resolveR2PublicBaseUrl(env: Record<string, string | undefined>): string {
  const override = env.R2_PUBLIC_BASE_URL?.trim();
  return override && override.length > 0 ? override : R2_CARD_IMAGES_PUBLIC_BASE_URL;
}

/** @deprecated Use {@link publishedImagePaths} — large art is on R2, not Pages. */
export function sameOriginImagePaths(cardId: number): { small: string; large: string } {
  return publishedImagePaths(cardId);
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
