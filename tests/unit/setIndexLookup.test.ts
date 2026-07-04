import { describe, expect, it } from 'vitest';

import { lookupSetIndexEntry, resolveSetIndexKey } from '../../src/shared/schema/setIndexLookup.ts';
import type { SetIndex } from '../../src/shared/schema/setIndex.ts';

describe('setIndexLookup', () => {
  const index: SetIndex = {
    "Yu-Gi-Oh! 5D's Tag Force 5 promotional cards": {
      tcgDate: '2010-10-26',
      numOfCards: 3,
    },
    'Phantom Nightmare': { tcgDate: '2024-02-09' },
  };

  it('lookupSetIndexEntry matches keys regardless of letter case', () => {
    expect(
      lookupSetIndexEntry(index, "Yu-Gi-Oh! 5D's Tag Force 5 Promotional Cards")?.tcgDate,
    ).toBe('2010-10-26');
    expect(lookupSetIndexEntry(index, 'phantom nightmare')?.tcgDate).toBe('2024-02-09');
    expect(lookupSetIndexEntry(index, 'Missing Set')).toBeUndefined();
    expect(lookupSetIndexEntry(null, 'Phantom Nightmare')).toBeUndefined();
  });

  it('resolveSetIndexKey reuses an existing key when only case differs', () => {
    expect(resolveSetIndexKey(index, "Yu-Gi-Oh! 5D's Tag Force 5 Promotional Cards")).toBe(
      "Yu-Gi-Oh! 5D's Tag Force 5 promotional cards",
    );
    expect(resolveSetIndexKey(index, 'Maze of Machines')).toBe('Maze of Machines');
  });
});
