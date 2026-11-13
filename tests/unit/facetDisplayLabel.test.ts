import { describe, expect, it } from 'vitest';

import {
  CORE_FACET_DEFINITIONS,
  YUGIOH_FACET_DEFINITIONS,
  facetDisplayLabel,
  facetDefinitionById,
} from '../../src/catalog/facets.ts';

describe('facetDisplayLabel', () => {
  it('uses short names without layer prefix', () => {
    const setDef = facetDefinitionById('set');
    expect(setDef).toBeDefined();
    expect(facetDisplayLabel(setDef!)).toBe('Set');
    expect(facetDisplayLabel(setDef!)).not.toMatch(/Core ·/);

    const cardType = facetDefinitionById('cardType');
    expect(facetDisplayLabel(cardType!)).toBe('Category');
  });

  it('covers every shipped facet definition', () => {
    for (const def of [...CORE_FACET_DEFINITIONS, ...YUGIOH_FACET_DEFINITIONS]) {
      const label = facetDisplayLabel(def);
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toMatch(/^(Core|Yu-Gi-Oh) ·/);
    }
  });
});
