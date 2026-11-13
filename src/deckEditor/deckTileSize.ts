/** Gap between tiles in the deck list and the mini search. */
export const DECK_TILE_GAP_PX = 6;

/** Desktop split. The deck list is ten across from this width, and four below it. */
export const DECK_LIST_DESKTOP_MIN_PX = 1024;

export function deckListColumnCount(viewportWidthPx: number): number {
  return viewportWidthPx >= DECK_LIST_DESKTOP_MIN_PX ? 10 : 4;
}

/** Width of one tile when a section shows `columns` tiles with {@link DECK_TILE_GAP_PX}. */
export function deckTileSizePx(sectionInnerWidthPx: number, columns: number): number {
  if (columns <= 0 || sectionInnerWidthPx <= 0) return 0;
  const gaps = DECK_TILE_GAP_PX * (columns - 1);
  return Math.max(0, Math.floor((sectionInnerWidthPx - gaps) / columns));
}

/** How many fixed-size tiles fit in a panel, including the gaps between them. */
export function columnsThatFit(
  panelInnerWidthPx: number,
  tilePx: number,
  gapPx = DECK_TILE_GAP_PX,
): number {
  if (tilePx <= 0 || panelInnerWidthPx <= 0) return 0;
  return Math.max(0, Math.floor((panelInnerWidthPx + gapPx) / (tilePx + gapPx)));
}
