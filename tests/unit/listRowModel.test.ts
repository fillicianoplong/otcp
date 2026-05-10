import { describe, expect, it } from 'vitest';

import {
  buildListRowLevelLine,
  buildListRowStatBadges,
  buildListRowStatsLine,
  buildListRowTypeLine,
} from '../../src/catalog/listRowModel.ts';
import linkMonster from '../fixtures/schema/link-monster.json';
import monster from '../fixtures/schema/monster-normal.json';
import spell from '../fixtures/schema/spell.json';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

describe('listRowModel', () => {
  it('builds readable monster type lines with attribute and race', () => {
    expect(buildListRowTypeLine(monster as YugiohCard)).toBe('DARK · Normal · Spellcaster');
    expect(buildListRowLevelLine(monster as YugiohCard)).toBe('Level 7');
    expect(buildListRowStatsLine(monster as YugiohCard)).toBe('ATK 2500 / DEF 2100');
  });

  it('builds spell property type lines', () => {
    expect(buildListRowTypeLine(spell as YugiohCard)).toBe('Normal Spell');
    expect(buildListRowLevelLine(spell as YugiohCard)).toBeNull();
    expect(buildListRowStatsLine(spell as YugiohCard)).toBeNull();
  });

  it('uses ATK and link rating for link monsters without DEF', () => {
    const stats = buildListRowStatBadges(linkMonster as YugiohCard);
    expect(stats).toEqual({ atk: '2300', linkRating: 4 });
    expect(buildListRowStatsLine(linkMonster as YugiohCard)).toBe('ATK 2300 · Link 4');
    expect(buildListRowLevelLine(linkMonster as YugiohCard)).toBe('Link 4');
    expect(buildListRowTypeLine(linkMonster as YugiohCard)).toBe('DARK · Link · Cyberse');
  });

  it('formats tuner monsters as readable subtypes', () => {
    const tuner: YugiohCard = {
      ...(monster as YugiohCard),
      type: 'Tuner Monster',
      race: 'Zombie',
      attribute: 'FIRE',
      level: 3,
      atk: 0,
      def: 1800,
    };
    expect(buildListRowTypeLine(tuner)).toBe('FIRE · Tuner · Zombie');
    expect(buildListRowLevelLine(tuner)).toBe('Level 3');
    expect(buildListRowStatsLine(tuner)).toBe('ATK 0 / DEF 1800');
  });
});
