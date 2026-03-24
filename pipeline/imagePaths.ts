import { join } from 'node:path';

import { CARD_IMAGES_SUBDIR, R2_CARD_IMAGES_PUBLIC_BASE_URL } from './constants.ts';

/** @deprecated Small art is on R2; use {@link publicSmallImageUrl}. */
export function sameOriginSmallPath(cardId: number): string {
  return `/otcp/${CARD_IMAGES_SUBDIR}/small/${cardId}.jpg`;
}

export function r2LargeObjectKey(cardId: number): string {
  return `ygo/large/${cardId}.webp`;
}

export function r2SmallObjectKey(cardId: number): string {
  return `ygo/small/${cardId}.webp`;
}

export function resolveR2PublicBaseUrl(env: Record<string, string | undefined>): string {
  const override = env.R2_PUBLIC_BASE_URL?.trim();
  return override && override.length > 0 ? override : R2_CARD_IMAGES_PUBLIC_BASE_URL;
}

/** Public URL for full-size card art on R2. */
export function publicLargeImageUrl(cardId: number, publicBaseUrl: string): string {
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/${r2LargeObjectKey(cardId)}`;
}

/** Public URL for grid/thumbnail card art on R2. */
export function publicSmallImageUrl(cardId: number, publicBaseUrl: string): string {
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/${r2SmallObjectKey(cardId)}`;
}

export function publishedImagePaths(
  cardId: number,
  publicBaseUrl: string = R2_CARD_IMAGES_PUBLIC_BASE_URL,
): { small: string; large: string } {
  return {
    small: publicSmallImageUrl(cardId, publicBaseUrl),
    large: publicLargeImageUrl(cardId, publicBaseUrl),
  };
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
