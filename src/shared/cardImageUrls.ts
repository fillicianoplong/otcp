/** Public base URL for card art on Cloudflare R2 (not a secret). */
export const R2_CARD_IMAGES_PUBLIC_BASE_URL = 'https://pub-ab4ad1f6449441f2ac7f95e0c9369606.r2.dev';

/** R2 object key for a hosted artwork (large WebP). */
export function r2LargeObjectKey(imageId: number): string {
  return `ygo/large/${imageId}.webp`;
}

/** R2 object key for a hosted artwork (small WebP). */
export function r2SmallObjectKey(imageId: number): string {
  return `ygo/small/${imageId}.webp`;
}

export function publicLargeImageUrl(imageId: number, publicBaseUrl: string): string {
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/${r2LargeObjectKey(imageId)}`;
}

export function publicSmallImageUrl(imageId: number, publicBaseUrl: string): string {
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/${r2SmallObjectKey(imageId)}`;
}

/** Default-art URLs keep the legacy card-id object keys for backward compatibility. */
export function publishedDefaultArtPaths(
  cardId: number,
  publicBaseUrl: string = R2_CARD_IMAGES_PUBLIC_BASE_URL,
): { small: string; large: string } {
  return {
    small: publicSmallImageUrl(cardId, publicBaseUrl),
    large: publicLargeImageUrl(cardId, publicBaseUrl),
  };
}

/** Alternate (non-default) artwork URLs use the YGOPRODeck image id in the object key. */
export function publishedImagePathsByImageId(
  imageId: number,
  publicBaseUrl: string = R2_CARD_IMAGES_PUBLIC_BASE_URL,
): { small: string; large: string } {
  return publishedDefaultArtPaths(imageId, publicBaseUrl);
}

/** @deprecated Use {@link publishedDefaultArtPaths} or {@link publishedImagePathsByImageId}. */
export function publishedImagePaths(
  cardId: number,
  publicBaseUrl: string = R2_CARD_IMAGES_PUBLIC_BASE_URL,
): { small: string; large: string } {
  return publishedDefaultArtPaths(cardId, publicBaseUrl);
}

export function publicBaseUrlFromPublishedImageUrl(url: string): string {
  const match = url.match(/^(.*)\/ygo\/(?:large|small)\/\d+\.webp$/);
  if (match?.[1]) return match[1];
  return R2_CARD_IMAGES_PUBLIC_BASE_URL;
}

/** YGOPRODeck CDN (fallback when hosted WebP for an image id is missing). */
export function ygoprodeckSmallImageUrl(imageId: number): string {
  return `https://images.ygoprodeck.com/images/cards_small/${imageId}.jpg`;
}

export function ygoprodeckLargeImageUrl(imageId: number): string {
  return `https://images.ygoprodeck.com/images/cards/${imageId}.jpg`;
}
