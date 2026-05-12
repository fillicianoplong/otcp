import { describe, expect, it } from 'vitest';

import { forgetCatalogDerived, getCatalogDerived } from '../../src/catalog/catalogDerived.ts';
import { forgetCatalogQueryCache, queryCatalog } from '../../src/catalog/catalogQueryCache.ts';
import { buildFilterEngine, emptyFilterState } from '../../src/catalog/filterEngine.ts';
import { buildSearchIndex } from '../../src/search/index.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import sampleDataset from '../../public/data/datasets/sample-dev.json';

const template = sampleDataset.cards[0] as YugiohCard;

function makeLargeCatalog(count: number): YugiohCard[] {
  const attrs = ['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND'] as const;
  const out: YugiohCard[] = new Array(count);
  for (let i = 0; i < count; i++) {
    out[i] = {
      ...template,
      id: 10_000_000 + i,
      passcode: 10_000_000 + i,
      name: `Synthetic Card ${i}`,
      attribute: attrs[i % attrs.length],
      atk: (i * 17) % 4000,
      def: (i * 13) % 4000,
    };
  }
  return out;
}

describe('getCatalogDerived', () => {
  it('builds indexes once and reuses them for the same catalog array', () => {
    const cards = makeLargeCatalog(32);
    const first = getCatalogDerived(cards);
    const second = getCatalogDerived(cards);
    expect(second).toBe(first);
    expect(first.cardById.get(cards[0]!.id)?.name).toBe(cards[0]!.name);
    expect(first.allIdsByName.length).toBe(cards.length);
    forgetCatalogDerived(cards);
    forgetCatalogQueryCache(cards);
  });

  it('looks up cards by passcode id', () => {
    const cards = sampleDataset.cards as YugiohCard[];
    const derived = getCatalogDerived(cards);
    expect(derived.cardById.get(89631139)?.name).toBe('Blue-Eyes White Dragon');
  });
});

describe('queryCatalog memoization', () => {
  it('returns the same result objects for an unchanged query state', () => {
    const cards = makeLargeCatalog(64);
    const derived = getCatalogDerived(cards);
    const state = emptyFilterState();
    const first = queryCatalog(derived, { filterState: state, query: 'Synthetic' });
    const second = queryCatalog(derived, { filterState: state, query: 'Synthetic' });
    expect(second.visibleCards).toBe(first.visibleCards);
    expect(second.facetGroupCounts).toBe(first.facetGroupCounts);
    expect(second.ids).toBe(first.ids);
    forgetCatalogDerived(cards);
    forgetCatalogQueryCache(cards);
  });
});

describe('catalog navigation benchmark (15k fixture)', () => {
  it('records index build and remount query timings', () => {
    const cards = makeLargeCatalog(15_000);
    forgetCatalogDerived(cards);
    forgetCatalogQueryCache(cards);

    const buildStart = performance.now();
    getCatalogDerived(cards);
    const firstBuildMs = performance.now() - buildStart;

    const reuseStart = performance.now();
    getCatalogDerived(cards);
    const reuseBuildMs = performance.now() - reuseStart;

    const derived = getCatalogDerived(cards);
    const filterState = emptyFilterState();

    const beforeRemountStart = performance.now();
    for (let pass = 0; pass < 2; pass++) {
      const engine = buildFilterEngine(cards);
      const index = buildSearchIndex(cards);
      const searchIds = index.query('Synthetic 7').ids;
      engine.apply(filterState, { searchIds });
      engine.recount(filterState, { searchIds });
    }
    const beforeRemountMs = performance.now() - beforeRemountStart;

    const coldQueryStart = performance.now();
    queryCatalog(derived, { filterState, query: 'Synthetic 7' });
    const coldQueryMs = performance.now() - coldQueryStart;

    const warmQueryStart = performance.now();
    queryCatalog(derived, { filterState, query: 'Synthetic 7' });
    const warmQueryMs = performance.now() - warmQueryStart;

    const afterRemountStart = performance.now();
    for (let pass = 0; pass < 2; pass++) {
      const d = getCatalogDerived(cards);
      queryCatalog(d, { filterState, query: 'Synthetic 7' });
      queryCatalog(d, { filterState, query: '' });
    }
    const afterRemountMs = performance.now() - afterRemountStart;

    expect(firstBuildMs).toBeGreaterThan(reuseBuildMs);
    expect(warmQueryMs).toBeLessThanOrEqual(coldQueryMs);

    console.info(
      JSON.stringify({
        fixtureCards: cards.length,
        indexBuildFirstMs: Math.round(firstBuildMs * 10) / 10,
        indexBuildReuseMs: Math.round(reuseBuildMs * 10) / 10,
        beforeTwoRemountPassesMs: Math.round(beforeRemountMs * 10) / 10,
        afterTwoRemountPassesMs: Math.round(afterRemountMs * 10) / 10,
        queryColdMs: Math.round(coldQueryMs * 10) / 10,
        queryWarmMs: Math.round(warmQueryMs * 10) / 10,
      }),
    );

    forgetCatalogDerived(cards);
    forgetCatalogQueryCache(cards);
  });
});
