import { describe, expect, it } from 'vitest';

import {
  CORE_FACET_DEFINITIONS,
  YUGIOH_FACET_DEFINITIONS,
  facetDefinitionsForGame,
} from '../../src/catalog/facets.ts';
import {
  FilterEngine,
  emptyFilterState,
  parseFilterState,
  serializeFilterState,
} from '../../src/catalog/filterEngine.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import sampleDataset from '../../public/data/datasets/sample-dev.json';

const sampleCards = sampleDataset.cards as YugiohCard[];

function card(partial: YugiohCard): YugiohCard {
  return partial;
}

describe('facet declarations', () => {
  it('ships core and Yu-Gi-Oh! layers for the selected game', () => {
    const defs = facetDefinitionsForGame('yugioh');
    expect(defs.length).toBe(CORE_FACET_DEFINITIONS.length + YUGIOH_FACET_DEFINITIONS.length);
    expect(defs.some((def) => def.layer === 'core' && def.id === 'cardType')).toBe(true);
    expect(defs.some((def) => def.layer === 'yugioh' && def.id === 'attribute')).toBe(true);
  });
});

describe('FilterEngine', () => {
  it('returns all cards for an empty filter state', () => {
    const engine = new FilterEngine(sampleCards);
    const result = engine.apply(emptyFilterState());
    expect(result.count).toBe(sampleCards.length);
    expect(result.ids.sort((a, b) => a - b)).toEqual(
      sampleCards.map((c) => c.id).sort((a, b) => a - b),
    );
  });

  it('includes cards by attribute', () => {
    const engine = new FilterEngine(sampleCards);
    const result = engine.apply({
      version: 1,
      facets: { attribute: { include: ['DARK'] } },
    });
    expect(result.ids).toContain(46986420);
    expect(result.count).toBe(5);
  });

  it('excludes cards by attribute', () => {
    const engine = new FilterEngine(sampleCards);
    const result = engine.apply({
      version: 1,
      facets: { attribute: { exclude: ['DARK'] } },
    });
    expect(result.ids).not.toContain(46986420);
    expect(result.count).toBe(sampleCards.length - 5);
  });

  it('ORs multiple included attributes', () => {
    const engine = new FilterEngine(sampleCards);
    const result = engine.apply({
      version: 1,
      facets: { attribute: { include: ['DARK', 'LIGHT'], mode: 'or' } },
    });
    expect(result.ids.sort((a, b) => a - b)).toEqual(expect.arrayContaining([46986420, 89631139]));
    expect(result.count).toBeGreaterThanOrEqual(2);
  });

  it('ORs multiple included monster frame tokens', () => {
    const engine = new FilterEngine([
      card({ ...sampleCards[0], id: 1, name: 'Fusion Effect', type: 'Fusion Effect Monster' }),
      card({ ...sampleCards[0], id: 2, name: 'Effect Only', type: 'Effect Monster' }),
    ]);
    const result = engine.apply({
      version: 1,
      facets: {
        monsterFrame: { include: ['Fusion', 'Effect'] },
      },
    });
    expect(result.ids.sort((a, b) => a - b)).toEqual([1, 2]);
  });

  it('ignores legacy AND mode in URLs and applies OR within monster frame', () => {
    const engine = new FilterEngine([
      card({ ...sampleCards[0], id: 1, name: 'Fusion Effect', type: 'Fusion Effect Monster' }),
      card({ ...sampleCards[0], id: 2, name: 'Effect Only', type: 'Effect Monster' }),
    ]);
    const result = engine.apply({
      version: 1,
      facets: {
        monsterFrame: { include: ['Fusion', 'Effect'], mode: 'and' },
      },
    });
    expect(result.ids.sort((a, b) => a - b)).toEqual([1, 2]);
  });

  it('supports include Effect and exclude Fusion on monster frames', () => {
    const engine = new FilterEngine([
      card({ ...sampleCards[1], id: 10, name: 'Fusion Effect', type: 'Fusion Effect Monster' }),
      card({ ...sampleCards[1], id: 11, name: 'Plain Effect', type: 'Effect Monster' }),
      card({ ...sampleCards[0], id: 12, name: 'Normal', type: 'Normal Monster' }),
    ]);
    const result = engine.apply({
      version: 1,
      facets: { monsterFrame: { include: ['Effect'], exclude: ['Fusion'] } },
    });
    expect(result.ids).toEqual([11]);
  });

  it('combines facets across groups with AND', () => {
    const engine = new FilterEngine(sampleCards);
    const result = engine.apply({
      version: 1,
      facets: {
        attribute: { include: ['DARK'] },
        archetype: { include: ['Dark Magician'] },
      },
    });
    expect(result.ids).toEqual([46986420]);
  });

  it('intersects with search ids when provided', () => {
    const engine = new FilterEngine(sampleCards);
    const result = engine.apply(
      { version: 1, facets: { attribute: { include: ['LIGHT', 'DARK'] } } },
      { searchIds: [89631139] },
    );
    expect(result.ids).toEqual([89631139]);
  });

  it('round-trips serializable filter state', () => {
    const state = {
      version: 1 as const,
      facets: { attribute: { include: ['DARK'], exclude: ['LIGHT'] } },
    };
    const parsed = parseFilterState(serializeFilterState(state));
    expect(parsed).toEqual(state);
  });

  it('refreshes facet counts for the current query (FR-57)', () => {
    const engine = new FilterEngine(sampleCards);
    const state = {
      version: 1 as const,
      facets: { attribute: { include: ['DARK'] } },
    };
    const groups = engine.recount(state);
    const attribute = groups.find((group) => group.fieldId === 'attribute');
    expect(attribute).toBeDefined();
    expect(engine.optionCount(groups, 'attribute', 'DARK')).toBe(5);
    expect(engine.optionCount(groups, 'attribute', 'LIGHT')).toBeGreaterThanOrEqual(1);
    expect(engine.apply(state).count).toBe(5);
  });

  it('uses OR-style facet counts that ignore the facet own selections', () => {
    const engine = new FilterEngine(sampleCards);
    const state = {
      version: 1 as const,
      facets: { attribute: { include: ['DARK'] } },
    };
    const groups = engine.recount(state);
    const lightCount = engine.optionCount(groups, 'attribute', 'LIGHT');
    const baseline = engine.recount(emptyFilterState());
    expect(lightCount).toBe(engine.optionCount(baseline, 'attribute', 'LIGHT'));
  });

  it('keeps sibling monster frame counts when another frame value is selected', () => {
    const engine = new FilterEngine(sampleCards);
    const baseline = engine.recount(emptyFilterState());
    const baselineNormal = engine.optionCount(baseline, 'monsterFrame', 'Normal');
    const groups = engine.recount({
      version: 1,
      facets: { monsterFrame: { include: ['Effect'] } },
    });
    expect(engine.optionCount(groups, 'monsterFrame', 'Normal')).toBe(baselineNormal);
  });

  it('updates counts in other groups when a facet selection is active', () => {
    const engine = new FilterEngine(sampleCards);
    const baseline = engine.recount(emptyFilterState());
    const baselineEffect = engine.optionCount(baseline, 'monsterFrame', 'Effect');
    const filtered = engine.recount({
      version: 1,
      facets: { attribute: { include: ['LIGHT'] } },
    });
    expect(engine.optionCount(filtered, 'monsterFrame', 'Effect')).not.toBe(baselineEffect);
  });

  it('uses disjunctive facet counts within every group including link arrows', () => {
    const cards: YugiohCard[] = [
      card({
        ...sampleCards[0],
        id: 1,
        name: 'A',
        linkMarkers: ['Top', 'Bottom', 'Left', 'Top-Left'],
      }),
      card({
        ...sampleCards[0],
        id: 2,
        name: 'B',
        linkMarkers: ['Top', 'Bottom', 'Left'],
      }),
      card({
        ...sampleCards[0],
        id: 3,
        name: 'C',
        linkMarkers: ['Top'],
      }),
    ];
    const engine = new FilterEngine(cards);
    const state = {
      version: 1 as const,
      facets: {
        linkMarker: {
          include: ['Top', 'Bottom'],
        },
      },
    };
    expect(engine.apply(state).ids.sort((a, b) => a - b)).toEqual([1, 2, 3]);
    const groups = engine.recount(state);
    expect(engine.optionCount(groups, 'linkMarker', 'Right')).toBe(0);
    const baseline = engine.recount(emptyFilterState());
    expect(engine.optionCount(groups, 'linkMarker', 'Bottom')).toBe(
      engine.optionCount(baseline, 'linkMarker', 'Bottom'),
    );
  });

  it('excludes cards without a stat when a custom range is set', () => {
    const cards: YugiohCard[] = [
      card({ ...sampleCards[0], id: 1, name: 'With def', def: 2000 }),
      card({ ...sampleCards[0], id: 2, name: 'Link only', def: undefined, linkRating: 2 }),
    ];
    const engine = new FilterEngine(cards);
    const result = engine.apply({
      version: 1,
      facets: { def: { range: { min: 1000, max: 2500 } } },
    });
    expect(result.ids).toEqual([1]);
  });

  it('excludes cards without a price when a price range is set', () => {
    const cards: YugiohCard[] = [
      card({ ...sampleCards[0], id: 1, name: 'Priced', prices: { tcgplayer: 3.5 } }),
      card({ ...sampleCards[0], id: 2, name: 'No price', prices: undefined }),
    ];
    const engine = new FilterEngine(cards);
    expect(engine.apply(emptyFilterState()).count).toBe(2);
    const filtered = engine.apply({
      version: 1,
      facets: { price: { range: { max: 5 } } },
    });
    expect(filtered.ids).toEqual([1]);
  });

  it('indexes set facets by set name only with one option per expansion', () => {
    const uniqueSetNames = 500;
    const template = sampleCards[0]!;
    const cards: YugiohCard[] = Array.from({ length: 15_000 }, (_, index) => ({
      ...template,
      id: index + 1,
      name: `Synthetic Card ${index}`,
      passcode: index + 1,
      sets: [
        {
          setCode: `SS05-EN${String(index).padStart(3, '0')}`,
          setName: `Expansion ${index % uniqueSetNames}`,
          setRarity: 'Common',
        },
        {
          setCode: `BLHR-EN${String(index).padStart(3, '0')}`,
          setName: `Expansion ${(index + 1) % uniqueSetNames}`,
          setRarity: 'Rare',
        },
      ],
    }));

    const engine = new FilterEngine(cards);
    const setGroup = engine.recount(emptyFilterState()).find((group) => group.fieldId === 'set');
    expect(setGroup).toBeDefined();
    expect(setGroup!.options).toHaveLength(uniqueSetNames);
    expect(setGroup!.options.every((opt) => !opt.value.includes('-EN'))).toBe(true);
    expect(setGroup!.options.every((opt) => opt.value.startsWith('Expansion '))).toBe(true);
  });
});
