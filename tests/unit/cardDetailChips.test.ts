import { describe, expect, it } from 'vitest';

import {
  buildCardDetailChips,
  buildCardDetailChipSearchHref,
  cardDetailLevelChipLabel,
} from '../../src/catalog/cardDetailChips.ts';
import { catalogTableColumnLabel } from '../../src/catalog/catalogTableColumns.ts';
import { readFilterStateFromParams } from '../../src/catalog/filterUrlState.ts';
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

describe('buildCardDetailChipSearchHref', () => {
  it('maps facet chips to single-filter search URLs', () => {
    const card = monsterNormal as YugiohCard;
    const chips = buildCardDetailChips(card);
    const attribute = chips.find((chip) => chip.label === 'Attribute')!;
    const type = chips.find((chip) => chip.label === 'Type')!;
    const level = chips.find((chip) => chip.label === 'Level')!;

    expect(
      readFilterStateFromParams(
        new URLSearchParams(
          buildCardDetailChipSearchHref(attribute, card)!.slice('/search?'.length),
        ),
      ).facets.attribute?.include,
    ).toEqual(['DARK']);
    expect(
      readFilterStateFromParams(
        new URLSearchParams(buildCardDetailChipSearchHref(type, card)!.slice('/search?'.length)),
      ).facets.race?.include,
    ).toEqual(['Spellcaster']);
    expect(
      readFilterStateFromParams(
        new URLSearchParams(buildCardDetailChipSearchHref(level, card)!.slice('/search?'.length)),
      ).facets.level?.include,
    ).toEqual(['Level-7']);
  });

  it('uses Rank and Link tokens for xyz and link monsters', () => {
    const rankCard = {
      ...(monsterNormal as YugiohCard),
      type: 'Xyz Monster',
      level: undefined,
      rank: 4,
    } satisfies YugiohCard;
    const rankChip = buildCardDetailChips(rankCard).find((chip) => chip.label === 'Rank')!;
    expect(
      readFilterStateFromParams(
        new URLSearchParams(
          buildCardDetailChipSearchHref(rankChip, rankCard)!.slice('/search?'.length),
        ),
      ).facets.level?.include,
    ).toEqual(['Rank-4']);

    const linkChip = buildCardDetailChips(linkMonster as YugiohCard).find(
      (chip) => chip.label === 'Link',
    )!;
    expect(
      readFilterStateFromParams(
        new URLSearchParams(
          buildCardDetailChipSearchHref(linkChip, linkMonster as YugiohCard)!.slice(
            '/search?'.length,
          ),
        ),
      ).facets.level?.include,
    ).toEqual(['Link-4']);
  });

  it('returns null for ATK, DEF, and chips without a facet value', () => {
    const card = monsterNormal as YugiohCard;
    const chips = buildCardDetailChips(card);
    const atk = chips.find((chip) => chip.label === 'ATK')!;
    const def = chips.find((chip) => chip.label === 'DEF')!;
    expect(buildCardDetailChipSearchHref(atk, card)).toBeNull();
    expect(buildCardDetailChipSearchHref(def, card)).toBeNull();

    const noArchetype = { ...(monsterNormal as YugiohCard), archetype: undefined };
    expect(
      buildCardDetailChipSearchHref(
        { label: catalogTableColumnLabel('archetype'), value: '—' },
        noArchetype,
      ),
    ).toBeNull();
  });
});
