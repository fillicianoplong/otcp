/** Public base URL for card art on Cloudflare R2 (not a secret). */
export const R2_CARD_IMAGES_PUBLIC_BASE_URL = 'https://pub-ab4ad1f6449441f2ac7f95e0c9369606.r2.dev';

export function r2LargeObjectKey(cardId: number): string {
  return `ygo/large/${cardId}.webp`;
}

export function r2SmallObjectKey(cardId: number): string {
  return `ygo/small/${cardId}.webp`;
}

export function publicLargeImageUrl(cardId: number, publicBaseUrl: string): string {
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/${r2LargeObjectKey(cardId)}`;
}

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
