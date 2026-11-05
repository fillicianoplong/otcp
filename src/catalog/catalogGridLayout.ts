/**
 * Search catalog grid column counts (FR-60 / W-26).
 * Phone viewports 360–430 CSS px use at least three columns; wider breakpoints scale up.
 */

export function catalogGridColumnCount(viewportWidthCssPx: number): number {
  if (viewportWidthCssPx >= 1400) return 8;
  if (viewportWidthCssPx >= 1200) return 7;
  if (viewportWidthCssPx >= 1024) return 6;
  if (viewportWidthCssPx >= 768) return 5;
  if (viewportWidthCssPx >= 640) return 4;
  return 3;
}

/** Full card scan in catalog grid tiles (Search + format ban grids). */
export const CATALOG_GRID_TILE_ART_CLASS =
  'block aspect-[59/86] w-full object-cover object-left-top';

/** Denser grid for format banlist sections (smaller thumbnails). */
export const FORMAT_BANLIST_GRID_CLASS =
  'grid grid-cols-4 items-start gap-1.5 sm:grid-cols-5 sm:gap-2 md:grid-cols-6 lg:grid-cols-8 min-[1200px]:grid-cols-10 [&_li_a>div]:leading-none [&_li_a>div>img]:block';

/** Tailwind classes aligned with {@link catalogGridColumnCount} breakpoints. */
export const CATALOG_GRID_CLASS =
  'grid grid-cols-3 items-start gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 min-[1200px]:grid-cols-7 min-[1400px]:grid-cols-8 [&_li_a>div]:leading-none [&_li_a>div>img]:block [&_li_a>div>img]:object-left-top [&_li_a>div>div]:block [&_li_a>div>div]:object-left-top';
