/** Cards rendered per Search grid batch (mobile-first incremental load). */
export const CATALOG_GRID_PAGE_SIZE = 48;

export function initialGridVisibleCount(
  totalMatches: number,
  pageSize = CATALOG_GRID_PAGE_SIZE,
): number {
  if (totalMatches <= 0) return 0;
  return Math.min(totalMatches, pageSize);
}

export function nextGridVisibleCount(
  currentVisible: number,
  totalMatches: number,
  pageSize = CATALOG_GRID_PAGE_SIZE,
): number {
  if (currentVisible >= totalMatches) return currentVisible;
  return Math.min(currentVisible + pageSize, totalMatches);
}

export function sliceGridCards<T>(cards: readonly T[], visibleCount: number): T[] {
  if (visibleCount <= 0) return [];
  return cards.slice(0, visibleCount);
}

export function gridHasMore(visibleCount: number, totalMatches: number): boolean {
  return visibleCount > 0 && visibleCount < totalMatches;
}
