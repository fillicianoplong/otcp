import { describe, expect, it } from 'vitest';

import {
  canAddDeckCopy,
  countDeckCopiesByCardId,
  deckCopyCountForCard,
} from '../../src/deck/deckCopyLimits.ts';

describe('deckCopyLimits', () => {
  it('counts different arts of the same card toward one copy limit', () => {
    const entries = [
      { cardId: 46986420, imageId: 46986420 },
      { cardId: 46986420, imageId: 46986421 },
      { cardId: 89631139, imageId: 89631139 },
    ];
    expect(deckCopyCountForCard(entries, 46986420)).toBe(2);
    expect(countDeckCopiesByCardId(entries).get(46986420)).toBe(2);
    expect(canAddDeckCopy(entries, 46986420, 3)).toBe(true);
    expect(canAddDeckCopy(entries, 46986420, 2)).toBe(false);
  });
});
