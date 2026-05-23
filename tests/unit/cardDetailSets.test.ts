import { describe, expect, it } from 'vitest';

import {
  buildCardDetailSetSearchHref,
  cardDetailSetRowCodeRarity,
  cardDetailSetRowReleaseDate,
  CARD_DETAIL_SETS_INITIAL_VISIBLE,
  cardDetailSetsExpandButtonLabel,
  cardDetailSetsHeadingCount,
  cardDetailSetsShowCollapseButton,
  cardDetailSetsVisibleCount,
} from '../../src/catalog/cardDetailSets.ts';
import { readFilterStateFromParams } from '../../src/catalog/filterUrlState.ts';

describe('cardDetailSets collapse UI', () => {
  it('shows every printing with no expand control when count is at the limit', () => {
    expect(cardDetailSetsVisibleCount(CARD_DETAIL_SETS_INITIAL_VISIBLE, false)).toBe(
      CARD_DETAIL_SETS_INITIAL_VISIBLE,
    );
    expect(cardDetailSetsExpandButtonLabel(CARD_DETAIL_SETS_INITIAL_VISIBLE)).toBeNull();
    expect(cardDetailSetsShowCollapseButton(CARD_DETAIL_SETS_INITIAL_VISIBLE, true)).toBe(false);
  });

  it('shows five printings and an expand label when there are more than five', () => {
    const total = 24;
    expect(cardDetailSetsVisibleCount(total, false)).toBe(CARD_DETAIL_SETS_INITIAL_VISIBLE);
    expect(cardDetailSetsExpandButtonLabel(total)).toBe('Show all 24 sets');
    expect(cardDetailSetsShowCollapseButton(total, false)).toBe(false);
    expect(cardDetailSetsHeadingCount(total)).toBe('Sets (24)');
  });

  it('reveals all printings and offers collapse after expand', () => {
    const total = 12;
    expect(cardDetailSetsVisibleCount(total, true)).toBe(12);
    expect(cardDetailSetsShowCollapseButton(total, true)).toBe(true);
    expect(cardDetailSetsExpandButtonLabel(total)).toBe('Show all 12 sets');
  });
});

describe('cardDetailSets printing helpers', () => {
  it('formats set row code and rarity on the second line', () => {
    expect(cardDetailSetRowCodeRarity('PHNI-EN001', 'Ultra Rare')).toBe('PHNI-EN001 · Ultra Rare');
  });

  it('formats a TCG release date for the first line when setIndex has tcgDate', () => {
    const setIndex = {
      'Phantom Nightmare': { tcgDate: '2024-02-09' },
    };
    expect(cardDetailSetRowReleaseDate('Phantom Nightmare', setIndex)).toBe('Feb 9, 2024');
  });

  it('omits the release date when setIndex has no tcgDate for that set', () => {
    const setIndex = {
      'Other Set': { tcgDate: '2024-02-09' },
    };
    expect(cardDetailSetRowReleaseDate('Phantom Nightmare', setIndex)).toBeNull();
  });

  it('omits the release date when tcgDate is missing or not parseable', () => {
    expect(
      cardDetailSetRowReleaseDate('Phantom Nightmare', {
        'Phantom Nightmare': {},
      }),
    ).toBeNull();
    expect(
      cardDetailSetRowReleaseDate('Phantom Nightmare', {
        'Phantom Nightmare': { tcgDate: 'not-a-date' },
      }),
    ).toBeNull();
  });

  it('builds search URLs with the set facet include filter', () => {
    const href = buildCardDetailSetSearchHref('Phantom Nightmare');
    expect(href.startsWith('/search?')).toBe(true);
    const params = new URLSearchParams(href.slice('/search?'.length));
    const state = readFilterStateFromParams(params);
    expect(state.facets.set?.include).toEqual(['Phantom Nightmare']);
  });
});
