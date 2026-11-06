/**
 * Search catalog grid column counts.
 * Phone viewports 360–430 CSS px use at least three columns.
 * Wider phones and tablets scale up. A typical desktop (Tailwind `lg`, 1024px)
 * keeps the search section at three columns.
 */
export const CATALOG_GRID_DESKTOP_MIN_WIDTH_PX = 1024;

export function catalogGridColumnCount(viewportWidthCssPx: number): number {
  if (viewportWidthCssPx < 360) return 2;
  if (viewportWidthCssPx >= CATALOG_GRID_DESKTOP_MIN_WIDTH_PX) return 3;
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
  'grid grid-cols-2 min-[360px]:grid-cols-3 items-start gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-3 [&_li_a>div]:leading-none [&_li_a>div>img]:block [&_li_a>div>img]:object-left-top [&_li_a>div>div]:block [&_li_a>div>div]:object-left-top';
