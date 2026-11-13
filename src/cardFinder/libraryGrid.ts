import { columnsThatFit, DECK_TILE_GAP_PX } from '../deckEditor/deckTileSize.ts';

/** Desktop side search. Four columns stretch across the thinner panel. */
export const LIBRARY_GRID_COLUMNS = 4;

/** Phone Add cards sheet. Four across, the same count as the deck list. */
export const LIBRARY_SHEET_COLUMNS = 4;

/** Narrowest tile before the mini search drops a column. */
export const LIBRARY_GRID_MIN_TILE_PX = 56;

/**
 * `preferred` columns when the panel can hold them. A narrower panel uses fewer
 * so the tiles stay readable and the row does not overflow.
 */
export function libraryGridColumnCount(
  panelInnerWidthPx: number,
  preferred = LIBRARY_GRID_COLUMNS,
): number {
  if (panelInnerWidthPx <= 0) return preferred;
  const fit = columnsThatFit(panelInnerWidthPx, LIBRARY_GRID_MIN_TILE_PX, DECK_TILE_GAP_PX);
  if (fit >= preferred) return preferred;
  return Math.max(2, fit);
}
