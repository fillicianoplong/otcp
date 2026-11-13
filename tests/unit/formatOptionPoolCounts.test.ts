import { describe, expect, it } from 'vitest';

import sampleDataset from '../../public/data/datasets/sample-dev.json';
import { getCatalogDerived } from '../../src/catalog/catalogDerived.ts';
import {
  computeFormatOptionPoolCounts,
  MAX_FORMATS_WITH_POOL_OPTION_COUNTS,
} from '../../src/catalog/formatOptionPoolCounts.ts';
import { queryCatalog } from '../../src/catalog/catalogQueryCache.ts';
import { emptyFilterState } from '../../src/catalog/filterEngine.ts';
import { listFormats } from '../../src/format/formatCatalog.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import type { SetIndex } from '../../src/shared/schema/setIndex.ts';

const sampleCards = sampleDataset.cards as YugiohCard[];
const setIndex = sampleDataset.setIndex as SetIndex;

describe('computeFormatOptionPoolCounts', () => {
  it('omits sidebar counts when the format catalog exceeds the cap', () => {
    expect(listFormats().length).toBeGreaterThan(MAX_FORMATS_WITH_POOL_OPTION_COUNTS);

    const derived = getCatalogDerived(sampleCards);
    const counts = computeFormatOptionPoolCounts(derived, {
      filterState: emptyFilterState(),
      setIndex,
    });

    expect(counts).toBeUndefined();
  });

  it('returns only the active format pool size when the catalog exceeds the cap', () => {
    const derived = getCatalogDerived(sampleCards);
    const filterState = emptyFilterState();

    const counts = computeFormatOptionPoolCounts(derived, {
      filterState,
      setIndex,
      activeFormatId: 'advanced',
    });

    const advancedCount = queryCatalog(derived, {
      filterState,
      formatParam: 'advanced',
      setIndex,
    }).matchCount;

    expect(counts).toEqual({ advanced: advancedCount });
    expect(advancedCount).toBe(sampleCards.length);
  });

  it('respects non-format facet filters for the active format count', () => {
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
      activeFormatId: 'goat',
    });

    const goatSpells = queryCatalog(derived, {
      filterState,
      formatParam: 'goat',
      setIndex,
    }).matchCount;

    expect(counts).toEqual({ goat: goatSpells });
  });
});
