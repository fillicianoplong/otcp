import { describe, expect, it } from 'vitest';

import { buildSetIndex } from '../../pipeline/buildSetIndex.ts';
import type { YgoCardsetRow } from '../../pipeline/fetchCardsets.ts';
import cardsetsFixture from '../fixtures/pipeline/ygoprodeck-cardsets-snippet.json';

describe('buildSetIndex', () => {
  it('maps YGOPRODeck cardsets rows to setName keys', () => {
    const index = buildSetIndex(cardsetsFixture);
    expect(index['Starter Deck: Yugi']).toEqual({
      tcgDate: '2002-03-08',
      numOfCards: 50,
    });
    expect(index['Legend of Blue Eyes White Dragon']?.numOfCards).toBe(126);
  });

  it('keeps source tcg_date when present and ignores overrides', () => {
    const rows: YgoCardsetRow[] = [
      {
        set_name: 'Limited Pack World Championship 2026',
        set_code: 'LPWC',
        num_of_cards: 42,
        tcg_date: '2026-01-01',
      },
    ];
    const index = buildSetIndex(rows);
    expect(index['Limited Pack World Championship 2026']).toEqual({
      tcgDate: '2026-01-01',
      numOfCards: 42,
    });
  });

  it('fills tcgDate from overrides when source tcg_date is missing', () => {
    const rows: YgoCardsetRow[] = [
      {
        set_name: 'Limited Pack World Championship 2026',
        set_code: 'LPWC',
        num_of_cards: 42,
        tcg_date: '',
      },
    ];
    const index = buildSetIndex(rows);
    expect(index['Limited Pack World Championship 2026']).toEqual({
      tcgDate: '2026-08-29',
      numOfCards: 42,
    });
  });

  it('applies override dates for collaboration sets and Maze of Machines', () => {
    const index = buildSetIndex([]);
    expect(index['Maze of Machines']).toEqual({ tcgDate: '2027-03-19' });
    expect(index['Crocs collaboration card']).toEqual({ tcgDate: '2026-09-10' });
    expect(index['EFootball collaboration cards']).toEqual({ tcgDate: '2025-09-27' });
    expect(index['Nike collaboration cards']).toEqual({ tcgDate: '2025-09-12' });
  });

  it('matches overrides to cardset rows when set names differ only by case', () => {
    const rows: YgoCardsetRow[] = [
      {
        set_name: "Yu-Gi-Oh! 5D's Tag Force 5 promotional cards",
        set_code: 'TF05',
        num_of_cards: 3,
        tcg_date: '2010-10-26',
      },
    ];
    const index = buildSetIndex(rows);
    expect(index["Yu-Gi-Oh! 5D's Tag Force 5 promotional cards"]).toEqual({
      tcgDate: '2010-10-26',
      numOfCards: 3,
    });
  });
});
