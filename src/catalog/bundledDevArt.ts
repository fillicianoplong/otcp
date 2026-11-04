/**
 * Local sample artwork for dev/e2e when alternate R2 keys are missing (see
 * {@link catalogSmallImageUrl}). Files live under e2e/fixtures/dev-art and are
 * served by Vite middleware — never copied into production dist.
 */
const BUNDLED_DARK_MAGICIAN_ART_IDS = new Set([46986420, 46986421, 46986414, 46986415, 46986416]);

export function devArtFallbackEnabled(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  return import.meta.env.VITE_DEV_ART_FALLBACK === 'true';
}

export function bundledDevArtUrl(imageId: number, size: 'small' | 'large'): string | null {
  if (!devArtFallbackEnabled()) {
    return null;
  }
  if (!BUNDLED_DARK_MAGICIAN_ART_IDS.has(imageId)) {
    return null;
  }
  const folder = size === 'small' ? 'small' : 'large';
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}dev-art/ygo/${folder}/${imageId}.webp`;
}
