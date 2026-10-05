import { describe, expect, it } from 'vitest';

import linkFixture from '../fixtures/schema/link-monster.json';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import {
  DEFAULT_GENESYS_POINT_CAP,
  evaluateGenesysDeckPoints,
  genesysRefusalReasonForCard,
  isGenesysLegalCardType,
  resolveGenesysPointCap,
  resolveGenesysPoints,
} from '../../src/format/formatEngine/genesysRules.ts';
import { lookupKonamiGenesysPointsByName } from '../../src/format/genesysKonamiPoints.ts';
import { validateDeckAdd } from '../../src/deckEditor/deckAddValidation.ts';

const ash: YugiohCard = {
  schemaVersion: '1.0.0',
  id: 14558127,
  name: 'Ash Blossom & Joyous Spring',
  type: 'Tuner Monster',
  text: '',
  images: { small: '/x.webp', large: '/x.webp' },
  sets: [],
  genesysPoints: 18,
};

const linkMonster = linkFixture as YugiohCard;

describe('genesysRules', () => {
  it('uses default cap 100 when none is stored', () => {
    expect(resolveGenesysPointCap(undefined)).toBe(DEFAULT_GENESYS_POINT_CAP);
    expect(DEFAULT_GENESYS_POINT_CAP).toBe(100);
  });

  it('honors a custom cap', () => {
    expect(resolveGenesysPointCap(50)).toBe(50);
  });

  it('refuses Link monsters', () => {
    expect(genesysRefusalReasonForCard(linkMonster)).toBe('link-monster');
    expect(isGenesysLegalCardType(linkMonster.type)).toBe(false);
  });

  it('sums deck points and flags over-cap totals', () => {
    const lookup = (id: number) => (id === ash.id ? ash : undefined);
    const under = evaluateGenesysDeckPoints([ash.id], [], [], lookup, 100);
    expect(under.totalPoints).toBe(18);
    expect(under.overCap).toBe(false);

    const main = Array.from({ length: 6 }, () => ash.id);
    const over = evaluateGenesysDeckPoints(main, [], [], lookup, 50);
    expect(over.totalPoints).toBe(108);
    expect(over.overCap).toBe(true);
  });

  it('matches Ash Blossom to Konami list points', () => {
    expect(lookupKonamiGenesysPointsByName('Ash Blossom & Joyous Spring')).toBe(18);
    expect(resolveGenesysPoints(ash)).toBe(18);
  });

  it('refuses adding a Link monster to a Genesys deck', () => {
    const result = validateDeckAdd(linkMonster, 'genesys', [], [], []);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('link-monster');
    }
  });
});
