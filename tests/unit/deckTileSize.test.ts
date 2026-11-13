import { describe, expect, it } from 'vitest';

import {
  columnsThatFit,
  deckListColumnCount,
  deckTileSizePx,
} from '../../src/deckEditor/deckTileSize.ts';

describe('deck tile size', () => {
  it('uses ten columns on desktop and four on a phone', () => {
    expect(deckListColumnCount(360)).toBe(4);
    expect(deckListColumnCount(390)).toBe(4);
    expect(deckListColumnCount(430)).toBe(4);
    expect(deckListColumnCount(1023)).toBe(4);
    expect(deckListColumnCount(1024)).toBe(10);
    expect(deckListColumnCount(1280)).toBe(10);
  });

  it('derives one tile width from the section and fits that width in a narrower panel', () => {
    const desktopTile = deckTileSizePx(774, 10);
    expect(desktopTile).toBe(72);
    expect(columnsThatFit(336, desktopTile)).toBe(4);

    const narrowTile = deckTileSizePx(506, 10);
    expect(narrowTile).toBe(45);
    expect(columnsThatFit(330, narrowTile)).toBe(6);

    const phoneTile = deckTileSizePx(326, 4);
    expect(phoneTile).toBe(77);
    expect(columnsThatFit(340, phoneTile)).toBe(4);
  });
});
