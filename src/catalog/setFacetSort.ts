import type { SetFacetSortMode } from './facetOptionOrdering.ts';

const STORAGE_KEY = 'otcp:setFacetSort';

export function readSetFacetSortMode(): SetFacetSortMode {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'newest' || stored === 'alpha') return stored;
  } catch {
    /* sessionStorage unavailable */
  }
  return 'newest';
}

export function writeSetFacetSortMode(mode: SetFacetSortMode): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* sessionStorage unavailable */
  }
}

export function hasSetReleaseDates(setIndex: Record<string, unknown> | null | undefined): boolean {
  if (!setIndex) return false;
  return Object.values(setIndex).some(
    (entry) =>
      entry != null &&
      typeof entry === 'object' &&
      'tcgDate' in entry &&
      typeof (entry as { tcgDate?: unknown }).tcgDate === 'string' &&
      (entry as { tcgDate: string }).tcgDate.length > 0,
  );
}
