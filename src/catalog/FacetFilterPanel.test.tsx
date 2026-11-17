/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import sampleDataset from '../../public/data/datasets/sample-dev.json';
import type { YugiohCard } from '../shared/schema/card.ts';
import { DEFAULT_CATALOG_TABLE_SORT } from './catalogTableSort.ts';
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

describe('FacetFilterPanel section chrome', () => {
  function renderPanel() {
    const engine = new FilterEngine(sampleCards);
    const groupCounts = engine.recount(emptyFilterState(), { formatParam: 'advanced' });
    const catalogFieldIds = engine.fieldsWithCatalog();
    return render(
      <FacetFilterPanel
        filterState={emptyFilterState()}
        groupCounts={groupCounts}
        catalogFieldIds={catalogFieldIds}
        onChange={() => {}}
        activeFormatId="advanced"
        onFormatChange={() => {}}
      />,
    );
  }

  it('names the header Filters and leaves each section to collapse on its own', async () => {
    const user = userEvent.setup();
    const { container } = renderPanel();

    const heading = screen.getByRole('heading', { name: 'Filters' });
    expect(heading.textContent).toBe('Filters');
    expect(screen.queryByRole('button', { name: 'Collapse all' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Expand all' })).toBeNull();

    const category = screen.getByRole('button', { name: 'Category' });
    expect(category).toHaveAttribute('aria-expanded', 'true');
    await user.click(category);
    expect(category).toHaveAttribute('aria-expanded', 'false');

    const format = container.querySelector('section button');
    expect(format).toHaveAttribute('aria-expanded', 'true');
  });

  it('rounds open headers and bodies on every section, including Format', () => {
    const { container } = renderPanel();
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(1);
    for (const section of sections) {
      expect(section.className).toContain('rounded-lg');
      const header = section.querySelector(':scope > button');
      expect(header?.className).toContain('rounded-t-lg');
      const body = section.querySelector(':scope > div');
      expect(body).toBeTruthy();
      expect(body!.className).toContain('rounded-lg');
    }
  });
});

describe('FacetFilterPanel sort section', () => {
  it('puts Sort above Format and keeps the field and direction in one row', async () => {
    const user = userEvent.setup();
    const engine = new FilterEngine(sampleCards);
    const groupCounts = engine.recount(emptyFilterState(), { formatParam: 'advanced' });
    const onSortChange = vi.fn();
    const { container } = render(
      <FacetFilterPanel
        filterState={emptyFilterState()}
        groupCounts={groupCounts}
        catalogFieldIds={engine.fieldsWithCatalog()}
        onChange={() => {}}
        activeFormatId="advanced"
        onFormatChange={() => {}}
        sort={DEFAULT_CATALOG_TABLE_SORT}
        onSortChange={onSortChange}
      />,
    );

    const titles = filterPanelSectionTitles(container);
    expect(titles[0]).toBe('Sort');
    expect(titles.indexOf('Format')).toBeGreaterThan(0);

    const sortSection = screen.getByRole('button', { name: 'Sort' }).closest('section');
    expect(sortSection?.className).toContain('rounded-lg');
    const panel = within(sortSection!);
    expect(panel.getByRole('combobox', { name: 'Field' })).toHaveValue('Name');
    const direction = panel.getByRole('button', { name: 'Ascending' });
    expect(direction).toHaveAttribute('title', 'Ascending');
    expect(direction.className).toContain('h-touch');
    expect(direction.className).toContain('rounded-md');
    await user.click(panel.getByRole('button', { name: 'Show fields' }));
    await user.click(panel.getByRole('option', { name: 'ATK' }));
    expect(onSortChange).toHaveBeenCalledWith({ column: 'atk', direction: 'asc' });
    await user.click(direction);
    expect(onSortChange).toHaveBeenCalledWith({ column: 'name', direction: 'desc' });
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
