import { describe, expect, it } from 'vitest';

import sampleDataset from '../../public/data/datasets/sample-dev.json';
import { getCatalogDerived } from '../../src/catalog/catalogDerived.ts';
import { computeFormatOptionPoolCounts } from '../../src/catalog/formatOptionPoolCounts.ts';
import { queryCatalog } from '../../src/catalog/catalogQueryCache.ts';
import { emptyFilterState } from '../../src/catalog/filterEngine.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import type { SetIndex } from '../../src/shared/schema/setIndex.ts';

const sampleCards = sampleDataset.cards as YugiohCard[];
const setIndex = sampleDataset.setIndex as SetIndex;

describe('computeFormatOptionPoolCounts', () => {
  it('returns per-format pool sizes under the same facet and search context', () => {
    const derived = getCatalogDerived(sampleCards);
    const filterState = emptyFilterState();

    const counts = computeFormatOptionPoolCounts(derived, {
      filterState,
      setIndex,
    });

    const advancedCount = queryCatalog(derived, {
      filterState,
      formatParam: 'advanced',
      setIndex,
    }).matchCount;
    const goatCount = queryCatalog(derived, {
      filterState,
      formatParam: 'goat',
      setIndex,
    }).matchCount;

    expect(counts.advanced).toBe(advancedCount);
    expect(counts.goat).toBe(goatCount);
    expect(goatCount).toBeLessThan(advancedCount);
    expect(counts.advanced).toBe(sampleCards.length);
  });

  it('respects non-format facet filters when counting each format pool', () => {
    const derived = getCatalogDerived(sampleCards);
    const filterState = {
      version: 1 as const,
      facets: {
        cardType: { include: ['Spell Card'] },
      },
    };

    const counts = computeFormatOptionPoolCounts(derived, {
      filterState,
      setIndex,
    });

    const goatSpells = queryCatalog(derived, {
      filterState,
      formatParam: 'goat',
      setIndex,
    }).matchCount;

    expect(counts.goat).toBe(goatSpells);
    expect(counts.goat).toBeLessThan(counts.advanced ?? 0);
  });
});
