/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';

import {
  clearGuestDraftImportDeclinedStorage,
  guestDraftIdsPendingImport,
  listDeclinedGuestDraftImportIds,
  markGuestDraftImportDeclined,
  markGuestDraftImportsDeclined,
  shouldOfferGuestDraftImport,
} from '../../src/deckStore/guestDraftImportPrompt.ts';

describe('guestDraftImportPrompt', () => {
  afterEach(() => {
    clearGuestDraftImportDeclinedStorage();
  });

  it('offers import only when signed in with pending drafts', () => {
    expect(shouldOfferGuestDraftImport({ signedIn: false, guestDraftIds: ['a'] })).toBe(false);
    expect(shouldOfferGuestDraftImport({ signedIn: true, guestDraftIds: [] })).toBe(false);
    expect(shouldOfferGuestDraftImport({ signedIn: true, guestDraftIds: ['a'] })).toBe(true);
  });

  it('remembers declined draft ids permanently on this profile', () => {
    markGuestDraftImportDeclined('draft-a');
    expect(listDeclinedGuestDraftImportIds()).toEqual(['draft-a']);
    expect(guestDraftIdsPendingImport(['draft-a', 'draft-b'])).toEqual(['draft-b']);
    expect(
      shouldOfferGuestDraftImport({ signedIn: true, guestDraftIds: ['draft-a', 'draft-b'] }),
    ).toBe(true);

    markGuestDraftImportsDeclined(['draft-b']);
    expect(guestDraftIdsPendingImport(['draft-a', 'draft-b'])).toEqual([]);
    expect(
      shouldOfferGuestDraftImport({ signedIn: true, guestDraftIds: ['draft-a', 'draft-b'] }),
    ).toBe(false);
  });
});
