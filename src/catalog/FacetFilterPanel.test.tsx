/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import sampleDataset from '../../public/data/datasets/sample-dev.json';
import type { YugiohCard } from '../shared/schema/card.ts';
import { FacetFilterPanel } from './FacetFilterPanel.tsx';
import { facetDefinitionById, facetDisplayLabel, SEARCH_FACET_FIELD_ORDER } from './facets.ts';
import { FilterEngine, emptyFilterState } from './filterEngine.ts';

const sampleCards = sampleDataset.cards as YugiohCard[];

const SEARCH_FILTER_SECTION_LABELS = [
  'Format',
  ...SEARCH_FACET_FIELD_ORDER.flatMap((fieldId) => {
    const def = facetDefinitionById(fieldId);
    if (!def) throw new Error(`missing facet ${fieldId}`);
    return [facetDisplayLabel(def)];
  }),
];

function filterPanelSectionTitles(container: HTMLElement): string[] {
  const stack = container.querySelector('.flex.flex-col.gap-3');
  expect(stack).toBeTruthy();
  const sections = stack!.querySelectorAll(':scope > section');
  return Array.from(sections).map((section) => {
    const panel = within(section as HTMLElement);
    if (panel.queryByLabelText('Format')) return 'Format';
    const heading = panel.getByRole('button', { expanded: true });
    return heading.textContent!.replace(/\s*[▸▾]\s*$/u, '').trim();
  });
}

afterEach(() => {
  cleanup();
});

describe('FacetFilterPanel filter group order', () => {
  it('lists Search filter groups in catalog order below Format', () => {
    const engine = new FilterEngine(sampleCards);
    const groupCounts = engine.recount(emptyFilterState(), { formatParam: 'advanced' });
    const catalogFieldIds = engine.fieldsWithCatalog();

    const { container } = render(
      <FacetFilterPanel
        filterState={emptyFilterState()}
        groupCounts={groupCounts}
        catalogFieldIds={catalogFieldIds}
        onChange={() => {}}
        activeFormatId="advanced"
        onFormatChange={() => {}}
      />,
    );

    const titles = filterPanelSectionTitles(container);
    const visible = new Set(titles);
    const expectedVisible = SEARCH_FILTER_SECTION_LABELS.filter((label) => visible.has(label));
    expect(titles).toEqual(expectedVisible);
    expect(titles.indexOf('Legality')).toBeGreaterThan(titles.indexOf('Format'));
  });

  it('hides Legality when no format is selected', () => {
    const engine = new FilterEngine(sampleCards);
    const groupCounts = engine.recount(emptyFilterState());
    const catalogFieldIds = engine.fieldsWithCatalog();

    const { container } = render(
      <FacetFilterPanel
        filterState={emptyFilterState()}
        groupCounts={groupCounts}
        catalogFieldIds={catalogFieldIds}
        onChange={() => {}}
        activeFormatId={null}
        onFormatChange={() => {}}
      />,
    );

    const titles = filterPanelSectionTitles(container);
    expect(titles).not.toContain('Legality');
  });
});

describe('FacetFilterPanel range inputs', () => {
  it('uses compact Min/Max placeholders and aria-labels instead of visible labels', async () => {
    const engine = new FilterEngine(sampleCards);
    const groupCounts = engine.recount(emptyFilterState());
    const catalogFieldIds = engine.fieldsWithCatalog();

    render(
      <FacetFilterPanel
        filterState={emptyFilterState()}
        groupCounts={groupCounts}
        catalogFieldIds={catalogFieldIds}
        onChange={() => {}}
      />,
    );

    const atkSection = screen.getByRole('button', { name: /^ATK$/ }).closest('section');
    expect(atkSection).toBeTruthy();
    const atkPanel = within(atkSection!);

    expect(screen.queryByText('Custom range')).toBeNull();
    expect(atkPanel.getByPlaceholderText('Min')).toBeTruthy();
    expect(atkPanel.getByPlaceholderText('Max')).toBeTruthy();
    expect(atkPanel.getByRole('spinbutton', { name: 'ATK minimum' })).toBeTruthy();
    expect(atkPanel.getByRole('spinbutton', { name: 'ATK maximum' })).toBeTruthy();
  });
});
