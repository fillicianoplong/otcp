export const ALL_ARTWORKS_QUERY_KEY = 'allArt';

export const ALL_ARTWORKS_STORAGE_KEY = 'otcp.search.allArtworks';

export function parseAllArtworksParam(raw: string | null): boolean {
  if (raw == null || raw === '') return true;
  if (raw === '0' || raw === 'false') return false;
  return true;
}

export function writeAllArtworksParam(params: URLSearchParams, enabled: boolean): void {
  if (enabled) {
    params.delete(ALL_ARTWORKS_QUERY_KEY);
  } else {
    params.set(ALL_ARTWORKS_QUERY_KEY, '0');
  }
}

export function readAllArtworksPreference(): boolean {
  try {
    const raw = localStorage.getItem(ALL_ARTWORKS_STORAGE_KEY);
    if (raw === '0') return false;
    if (raw === '1') return true;
  } catch {
    /* ignore */
  }
  return true;
}

export function persistAllArtworksPreference(enabled: boolean): void {
  try {
    localStorage.setItem(ALL_ARTWORKS_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function resolveAllArtworksPreference(urlParam: string | null): boolean {
  if (urlParam != null && urlParam !== '') {
    return parseAllArtworksParam(urlParam);
  }
  return readAllArtworksPreference();
}
