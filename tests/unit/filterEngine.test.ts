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
    expect(result.ids).toEqual([46986420]);
  });

  it('excludes cards by attribute', () => {
    const engine = new FilterEngine(sampleCards);
    const result = engine.apply({
      version: 1,
      facets: { attribute: { exclude: ['DARK'] } },
    });
    expect(result.ids).not.toContain(46986420);
    expect(result.count).toBe(sampleCards.length - 1);
  });

  it('ORs multiple included attributes', () => {
    const engine = new FilterEngine(sampleCards);
    const result = engine.apply({
      version: 1,
      facets: { attribute: { include: ['DARK', 'LIGHT'], mode: 'or' } },
    });
    expect(result.ids.sort((a, b) => a - b)).toEqual([46986420, 89631139]);
  });

  it('ANDs multiple included monster frame tokens', () => {
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
    expect(result.ids).toEqual([1]);
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
    expect(engine.optionCount(groups, 'attribute', 'DARK')).toBe(1);
    expect(engine.optionCount(groups, 'attribute', 'LIGHT')).toBe(1);
    expect(engine.apply(state).count).toBe(1);
  });
});
