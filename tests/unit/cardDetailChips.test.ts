import { describe, expect, it } from 'vitest';

import {
  buildCardDetailChips,
  cardDetailLevelChipLabel,
} from '../../src/catalog/cardDetailChips.ts';
import { catalogTableColumnLabel } from '../../src/catalog/catalogTableColumns.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import linkMonster from '../fixtures/schema/link-monster.json';
import monsterNormal from '../fixtures/schema/monster-normal.json';
import spell from '../fixtures/schema/spell.json';

function chipMap(card: YugiohCard): Map<string, string> {
  return new Map(buildCardDetailChips(card).map((chip) => [chip.label, chip.value]));
}

describe('buildCardDetailChips', () => {
  it('uses catalog table column labels and omits empty values', () => {
    const chips = buildCardDetailChips(monsterNormal as YugiohCard);
    expect(chips.map((chip) => chip.label)).toEqual([
      catalogTableColumnLabel('attribute'),
      catalogTableColumnLabel('type'),
      catalogTableColumnLabel('level'),
      catalogTableColumnLabel('atk'),
      catalogTableColumnLabel('def'),
      catalogTableColumnLabel('archetype'),
      catalogTableColumnLabel('cardType'),
    ]);
    expect(chipMap(monsterNormal as YugiohCard).get('Attribute')).toBe('DARK');
    expect(chipMap(monsterNormal as YugiohCard).get('ATK')).toBe('2500');
  });

  it('leaves out monster-only chips for spells and traps', () => {
    const labels = buildCardDetailChips(spell as YugiohCard).map((chip) => chip.label);
    expect(labels).toEqual([catalogTableColumnLabel('type'), catalogTableColumnLabel('cardType')]);
    expect(labels).not.toContain(catalogTableColumnLabel('attribute'));
    expect(labels).not.toContain(catalogTableColumnLabel('level'));
  });

  it('labels link rating chips as Link and skips DEF', () => {
    expect(cardDetailLevelChipLabel(linkMonster as YugiohCard)).toBe('Link');
    const chips = buildCardDetailChips(linkMonster as YugiohCard);
    expect(chips.some((chip) => chip.label === 'Link' && chip.value === '4')).toBe(true);
    expect(chips.some((chip) => chip.label === catalogTableColumnLabel('def'))).toBe(false);
  });
});
