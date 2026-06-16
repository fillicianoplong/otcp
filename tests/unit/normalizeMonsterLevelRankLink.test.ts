import { describe, expect, it } from 'vitest';

import {
  normalizeYugiohCardLevelRankLink,
  resolveMonsterLevelRankLink,
} from '../../src/shared/schema/normalizeMonsterLevelRankLink.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

describe('resolveMonsterLevelRankLink', () => {
  it('maps Xyz level to rank only', () => {
    expect(resolveMonsterLevelRankLink({ type: 'Xyz Monster', level: 4 })).toEqual({ rank: 4 });
  });

  it('maps Link monsters to linkRating only when upstream sends level 0', () => {
    expect(resolveMonsterLevelRankLink({ type: 'Link Monster', level: 0, linkval: 1 })).toEqual({
      linkRating: 1,
    });
  });

  it('keeps Level 0 on Synchro monsters', () => {
    expect(resolveMonsterLevelRankLink({ type: 'Synchro Monster', level: 0 })).toEqual({
      level: 0,
    });
  });
});

describe('normalizeYugiohCardLevelRankLink', () => {
  it('strips level from published Link rows', () => {
    const card = {
      schemaVersion: '1.0.0',
      id: 1,
      name: 'Link',
      type: 'Link Monster',
      text: 'x',
      images: { small: '/a', large: '/b' },
      sets: [],
      level: 0,
      linkRating: 2,
    } satisfies YugiohCard;
    const normalized = normalizeYugiohCardLevelRankLink(card);
    expect(normalized.level).toBeUndefined();
    expect(normalized.rank).toBeUndefined();
    expect(normalized.linkRating).toBe(2);
  });
});
