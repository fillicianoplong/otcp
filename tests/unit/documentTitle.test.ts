import { describe, expect, it } from 'vitest';

import {
  PRODUCT_DOCUMENT_TITLE,
  cardRouteIdFromPathname,
  deckDraftIdFromPathname,
  documentTitleForRoute,
  formatDocumentTitle,
} from '../../src/documentTitle.ts';

describe('formatDocumentTitle', () => {
  it('uses a space-hyphen-space separator and falls back when the label is blank', () => {
    expect(formatDocumentTitle('Search')).toBe('Search - OTCP');
    expect(formatDocumentTitle('  Dark Magician  ')).toBe('Dark Magician - OTCP');
    expect(formatDocumentTitle('')).toBe(PRODUCT_DOCUMENT_TITLE);
    expect(formatDocumentTitle('   ')).toBe(PRODUCT_DOCUMENT_TITLE);
    expect(formatDocumentTitle(null)).toBe(PRODUCT_DOCUMENT_TITLE);
    expect(formatDocumentTitle('Search')).not.toContain('·');
  });
});

describe('documentTitleForRoute', () => {
  it('titles each top-level route and leaves home and unknown paths as OTCP', () => {
    expect(documentTitleForRoute({ pathname: '/' })).toBe('OTCP');
    expect(documentTitleForRoute({ pathname: '/search' })).toBe('Search - OTCP');
    expect(documentTitleForRoute({ pathname: '/formats' })).toBe('Formats - OTCP');
    expect(documentTitleForRoute({ pathname: '/decks' })).toBe('Decks - OTCP');
    expect(documentTitleForRoute({ pathname: '/collection' })).toBe('Collection - OTCP');
    expect(documentTitleForRoute({ pathname: '/lists' })).toBe('Lists - OTCP');
    expect(documentTitleForRoute({ pathname: '/about' })).toBe('About - OTCP');
    expect(documentTitleForRoute({ pathname: '/account' })).toBe('Account - OTCP');
    expect(documentTitleForRoute({ pathname: '/missing' })).toBe('OTCP');
    expect(documentTitleForRoute({ pathname: '/search/nope' })).toBe('OTCP');
    expect(documentTitleForRoute({ pathname: '/banlists' })).toBe('OTCP');
  });

  it('uses the card display name, format name, and deck name on detail routes', () => {
    expect(
      documentTitleForRoute({ pathname: '/search/card/46986420', cardName: 'Dark Magician' }),
    ).toBe('Dark Magician - OTCP');
    expect(
      documentTitleForRoute({
        pathname: '/search/card/89631139',
        cardName: 'Blue-Eyes White Dragon',
      }),
    ).toBe('Blue-Eyes White Dragon - OTCP');
    expect(documentTitleForRoute({ pathname: '/search/card/46986420' })).toBe('OTCP');
    expect(documentTitleForRoute({ pathname: '/formats/goat' })).toBe('GOAT - OTCP');
    expect(documentTitleForRoute({ pathname: '/formats/GOAT' })).toBe('GOAT - OTCP');
    expect(documentTitleForRoute({ pathname: '/formats/speed-duel' })).toBe('Speed Duel - OTCP');
    expect(documentTitleForRoute({ pathname: '/formats/not-a-format' })).toBe('OTCP');
    expect(
      documentTitleForRoute({ pathname: '/decks/edit/draft-1', deckName: 'Weekend locals' }),
    ).toBe('Weekend locals - OTCP');
    expect(documentTitleForRoute({ pathname: '/decks/edit/draft-1' })).toBe('OTCP');
    expect(documentTitleForRoute({ pathname: '/decks/edit/draft-1', deckName: '   ' })).toBe(
      'OTCP',
    );
  });

  it('ignores detail names when the path is a different route', () => {
    expect(
      documentTitleForRoute({
        pathname: '/search',
        cardName: 'Dark Magician',
        deckName: 'Weekend locals',
      }),
    ).toBe('Search - OTCP');
  });

  it('reads card and deck ids from the pathname', () => {
    expect(cardRouteIdFromPathname('/search/card/46986421')).toBe(46986421);
    expect(cardRouteIdFromPathname('/search/card/nope')).toBeNull();
    expect(cardRouteIdFromPathname('/search')).toBeNull();
    expect(deckDraftIdFromPathname('/decks/edit/abc-123')).toBe('abc-123');
    expect(deckDraftIdFromPathname('/decks')).toBeNull();
  });
});
