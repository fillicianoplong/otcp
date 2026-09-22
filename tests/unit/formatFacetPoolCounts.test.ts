import { describe, expect, it } from 'vitest';

import { getCatalogDerived } from '../../src/catalog/catalogDerived.ts';
import { queryCatalog } from '../../src/catalog/catalogQueryCache.ts';
import { emptyFilterState } from '../../src/catalog/filterEngine.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import type { SetIndex } from '../../src/shared/schema/setIndex.ts';
import sampleDataset from '../../public/data/datasets/sample-dev.json';

const sampleCards = sampleDataset.cards as YugiohCard[];
const setIndex = sampleDataset.setIndex as SetIndex;

function sumFacetOptionCounts(
  groups: ReturnType<typeof queryCatalog>['facetGroupCounts'],
  fieldId: 'banStatus' | 'cardType',
): number {
  const group = groups.find((entry) => entry.fieldId === fieldId);
  if (!group) return 0;
  return group.options.reduce((total, option) => total + option.count, 0);
}

describe('facet counts within format pool', () => {
  it('sums Legality option counts to the GOAT pool size', () => {
    const derived = getCatalogDerived(sampleCards);
    const result = queryCatalog(derived, {
      filterState: emptyFilterState(),
      formatParam: 'goat',
      setIndex,
    });

    expect(result.matchCount).toBeLessThan(sampleCards.length);
    expect(sumFacetOptionCounts(result.facetGroupCounts, 'banStatus')).toBe(result.matchCount);
  });

  it('sums Category option counts to the GOAT pool size', () => {
    const derived = getCatalogDerived(sampleCards);
    const result = queryCatalog(derived, {
      filterState: emptyFilterState(),
      formatParam: 'goat',
      setIndex,
    });

    expect(sumFacetOptionCounts(result.facetGroupCounts, 'cardType')).toBe(result.matchCount);
  });
});
