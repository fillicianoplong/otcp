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
    ).toEqual(['7']);
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
    ).toEqual(['4']);

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
    ).toEqual(['4']);
  });

  it('maps ATK and DEF chips to exact range search URLs', () => {
    const card = monsterNormal as YugiohCard;
    const chips = buildCardDetailChips(card);
    const atk = chips.find((chip) => chip.label === 'ATK')!;
    const def = chips.find((chip) => chip.label === 'DEF')!;

    const atkState = readFilterStateFromParams(
      new URLSearchParams(buildCardDetailChipSearchHref(atk, card)!.slice('/search?'.length)),
    );
    expect(atkState.facets.atk?.range).toEqual({ min: 2500, max: 2500 });

    const defState = readFilterStateFromParams(
      new URLSearchParams(buildCardDetailChipSearchHref(def, card)!.slice('/search?'.length)),
    );
    expect(defState.facets.def?.range).toEqual({ min: 2100, max: 2100 });

    const zeroAtkCard = { ...(monsterNormal as YugiohCard), atk: 0, def: 0 };
    const zeroAtk = buildCardDetailChips(zeroAtkCard).find((chip) => chip.label === 'ATK')!;
    expect(
      readFilterStateFromParams(
        new URLSearchParams(
          buildCardDetailChipSearchHref(zeroAtk, zeroAtkCard)!.slice('/search?'.length),
        ),
      ).facets.atk?.range,
    ).toEqual({ min: 0, max: 0 });
  });

  it('maps ATK and DEF ? chips to the facet ? bucket', () => {
    const questionAtkCard = { ...(monsterNormal as YugiohCard), atk: -1 };
    const questionChip = buildCardDetailChips(questionAtkCard).find(
      (chip) => chip.label === 'ATK',
    )!;
    expect(questionChip.value).toBe('?');
    expect(
      readFilterStateFromParams(
        new URLSearchParams(
          buildCardDetailChipSearchHref(questionChip, questionAtkCard)!.slice('/search?'.length),
        ),
      ).facets.atk?.include,
    ).toEqual(['?']);

    const card = monsterNormal as YugiohCard;
    const atk = buildCardDetailChips(card).find((chip) => chip.label === 'ATK')!;
    expect(
      readFilterStateFromParams(
        new URLSearchParams(
          buildCardDetailChipSearchHref({ ...atk, value: '?' }, { ...card, atk: -1 })!.slice(
            '/search?'.length,
          ),
        ),
      ).facets.atk?.include,
    ).toEqual(['?']);
  });

  it('returns null for missing ATK and DEF stats and link monsters without DEF', () => {
    const card = monsterNormal as YugiohCard;
    const atk = buildCardDetailChips(card).find((chip) => chip.label === 'ATK')!;

    expect(
      buildCardDetailChipSearchHref({ ...atk, value: '?' }, { ...card, atk: undefined }),
    ).toBeNull();

    const linkAtk = buildCardDetailChips(linkMonster as YugiohCard).find(
      (chip) => chip.label === 'ATK',
    )!;
    expect(buildCardDetailChipSearchHref(linkAtk, linkMonster as YugiohCard)).not.toBeNull();
    expect(
      buildCardDetailChipSearchHref(
        { label: catalogTableColumnLabel('def'), value: '—' },
        linkMonster as YugiohCard,
      ),
    ).toBeNull();
  });

  it('returns null for chips without a facet value', () => {
    const noArchetype = { ...(monsterNormal as YugiohCard), archetype: undefined };
    expect(
      buildCardDetailChipSearchHref(
        { label: catalogTableColumnLabel('archetype'), value: '—' },
        noArchetype,
      ),
    ).toBeNull();
  });
});
