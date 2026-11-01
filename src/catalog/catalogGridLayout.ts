/**
 * Search catalog grid column counts (FR-60 / W-26).
 * Phone viewports 360–430 CSS px use at least three columns; wider breakpoints scale up.
 */

export function catalogGridColumnCount(viewportWidthCssPx: number): number {
  if (viewportWidthCssPx >= 1024) return 6;
  if (viewportWidthCssPx >= 768) return 5;
  if (viewportWidthCssPx >= 640) return 4;
  return 3;
}

/** Tailwind classes aligned with {@link catalogGridColumnCount} breakpoints. */
export const CATALOG_GRID_CLASS =
  'grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6';
