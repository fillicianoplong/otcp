import { describe, expect, it } from 'vitest';

import {
  evaluateDeckAdd,
  evaluateDeckSizes,
  type DeckListState,
} from '../../src/format/formatEngine.ts';
import { isCardInFormatPool } from '../../src/format/formatPool.ts';
import { deckSectionLimitsForFormat } from '../../src/format/formatDeckRules.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

function baseCard(
  overrides: Partial<YugiohCard> & Pick<YugiohCard, 'id' | 'name' | 'type'>,
): YugiohCard {
  return {
    schemaVersion: '1.0.0',
    text: '',
    images: { small: '/s.webp', large: '/l.webp' },
    sets: [{ setCode: 'SD', setName: 'Sample', setRarity: 'Common' }],
    ...overrides,
  };
}

const speedSpell = baseCard({
  id: 40374923,
  name: 'Mystical Space Typhoon',
  type: 'Quick-Play Spell Card',
  speedDuelLegal: true,
});

const tcgOnly = baseCard({
  id: 14558127,
  name: 'Ash Blossom & Joyous Spring',
  type: 'Tuner Monster',
});

const skillOne = baseCard({
  id: 300302050,
  name: 'HEROES UNITE - FUSION!!',
  type: 'Skill Card',
  speedDuelLegal: true,
});

const skillTwo = baseCard({
  id: 300302022,
  name: 'Ancient Fusion',
  type: 'Skill Card',
  speedDuelLegal: true,
});

const emptyDeck: DeckListState = { main: [], extra: [], side: [], skillId: null };

describe('formatEngine Speed Duel pool', () => {
  it('refuses a non-Speed-Duel card in the Speed Duel format', () => {
    expect(isCardInFormatPool(tcgOnly, 'speed-duel')).toBe(false);
    const result = evaluateDeckAdd(tcgOnly, 'main', emptyDeck, 'speed-duel');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('not-in-pool');
    }
  });

  it('allows Speed Duel pool cards in the Speed Duel format', () => {
    expect(isCardInFormatPool(speedSpell, 'speed-duel')).toBe(true);
    expect(evaluateDeckAdd(speedSpell, 'main', emptyDeck, 'speed-duel').ok).toBe(true);
  });
});

describe('formatEngine Skill rules', () => {
  it('allows one Skill and refuses a second active Skill', () => {
    const withSkill: DeckListState = { ...emptyDeck, skillId: skillOne.id };
    expect(evaluateDeckAdd(skillOne, 'skill', withSkill, 'speed-duel').ok).toBe(true);

    const second = evaluateDeckAdd(skillTwo, 'skill', withSkill, 'speed-duel');
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toBe('second-skill');
    }
  });
});

describe('formatEngine deck size limits', () => {
  it('uses Speed Duel Main 20–30, Extra 6, Side 6', () => {
    const limits = deckSectionLimitsForFormat('speed-duel');
    expect(limits).toEqual({
      mainMin: 20,
      mainMax: 30,
      extraMax: 6,
      sideMax: 6,
      maxActiveSkills: 1,
    });
  });

  it('flags Main over 30 in Speed Duel', () => {
    const main = Array.from({ length: 31 }, (_, index) => 1000 + index);
    const violations = evaluateDeckSizes({ main, extra: [], side: [] }, 'speed-duel');
    expect(violations).toContain('main-over-max');
  });

  it('refuses a 31st Main Deck card on add', () => {
    const main = Array.from({ length: 30 }, (_, index) => 2000 + index);
    const deck: DeckListState = { main, extra: [], side: [] };
    const result = evaluateDeckAdd(speedSpell, 'main', deck, 'speed-duel');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('section-full');
    }
  });
});
