/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import sampleDataset from '../../public/data/datasets/sample-dev.json';
import type { YugiohCard } from '../shared/schema/card.ts';
import { FacetFilterPanel, PhoneFiltersSheet } from './FacetFilterPanel.tsx';
import {
  CORE_FACET_DEFINITIONS,
  SEARCH_FACET_FIELD_ORDER,
  facetDefinitionById,
  facetDisplayLabel,
} from './facets.ts';
import { FilterEngine, emptyFilterState } from './filterEngine.ts';
import { YUGIOH_FIELD_INDEXERS } from '../games/yugiohCardFacets.ts';
import type { GameDefinition } from '../games/types.ts';
import type { FormatDefinition } from '../format/formatCatalog.ts';

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
    if (panel.queryByLabelText('Game')) return 'Game';
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
    expect(titles[0]).toBe('Game');
    expect((screen.getByRole('combobox', { name: 'Game' }) as HTMLInputElement).value).toBe(
      'Yu-Gi-Oh!',
    );
    expect(titles.slice(1)).toEqual(expectedVisible);
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

describe('FacetFilterPanel sections', () => {
  it('keeps Game first and leaves sort out of the panel', () => {
    const engine = new FilterEngine(sampleCards);
    const groupCounts = engine.recount(emptyFilterState(), { formatParam: 'advanced' });
    const { container } = render(
      <FacetFilterPanel
        filterState={emptyFilterState()}
        groupCounts={groupCounts}
        catalogFieldIds={engine.fieldsWithCatalog()}
        onChange={() => {}}
        activeFormatId="advanced"
        onFormatChange={() => {}}
      />,
    );

    const titles = filterPanelSectionTitles(container);
    expect(titles[0]).toBe('Game');
    expect(titles).not.toContain('Sort');
    expect(titles.indexOf('Format')).toBeGreaterThan(0);
    expect(screen.queryByRole('combobox', { name: 'Field' })).toBeNull();
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

const DEMO_FORMAT: FormatDefinition = {
  id: 'demo-format',
  name: 'Demo Format',
  cardSubtitle: 'Demo',
  banlistHeading: 'Demo list',
  deckRulesSummary: 'Main 40',
  poolRule: 'full-tcg',
  banlistSource: 'tcg-current',
  traditionalForbiddenAsLimited: false,
};

const DEMO_GAME: GameDefinition = {
  id: 'demo',
  name: 'Demo TCG',
  facetDefinitions: CORE_FACET_DEFINITIONS.filter((definition) => definition.id === 'cardType'),
  facetFieldOrder: ['cardType'],
  fieldIndexers: YUGIOH_FIELD_INDEXERS.filter((indexer) => indexer.id === 'cardType'),
  rangeFieldIds: [],
  skipBitsetUnionFieldIds: [],
  listFormatsNewestFirst: () => [DEMO_FORMAT],
  isKnownFormatId: (id) => id === DEMO_FORMAT.id,
  prepareCard: (card) => card,
  rowMatchesRange: () => true,
  banStatusValue: () => 'Unlimited',
};

describe('FacetFilterPanel game section', () => {
  it('shows Yu-Gi-Oh! first in the phone filters sheet', () => {
    const engine = new FilterEngine(sampleCards);
    render(
      <PhoneFiltersSheet
        open
        onClose={() => {}}
        draftState={emptyFilterState()}
        onDraftChange={() => {}}
        onApply={() => {}}
        onReset={() => {}}
        resultCount={engine.count}
        draftGroupCounts={engine.recount(emptyFilterState())}
        catalogFieldIds={engine.fieldsWithCatalog()}
        onDraftFormatChange={() => {}}
      />,
    );

    const titles = filterPanelSectionTitles(document.body);
    expect(titles[0]).toBe('Game');
    expect((screen.getByRole('combobox', { name: 'Game' }) as HTMLInputElement).value).toBe(
      'Yu-Gi-Oh!',
    );
    expect(titles.indexOf('Format')).toBeGreaterThan(0);
  });

  it('swaps filter groups and formats when another game is selected', async () => {
    const user = userEvent.setup();
    const engine = new FilterEngine(sampleCards, DEMO_GAME);
    const { container } = render(
      <FacetFilterPanel
        filterState={emptyFilterState()}
        groupCounts={engine.recount(emptyFilterState())}
        catalogFieldIds={engine.fieldsWithCatalog()}
        onChange={() => {}}
        games={[DEMO_GAME]}
        gameId={DEMO_GAME.id}
        activeFormatId={DEMO_FORMAT.id}
        onFormatChange={() => {}}
      />,
    );

    const titles = filterPanelSectionTitles(container);
    expect(titles).toEqual(['Game', 'Format', 'Category']);
    expect((screen.getByRole('combobox', { name: 'Game' }) as HTMLInputElement).value).toBe(
      'Demo TCG',
    );
    expect(screen.queryByRole('button', { name: 'Attribute' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^ATK$/ })).toBeNull();

    await user.click(screen.getByRole('combobox', { name: 'Format' }));
    const names = screen.getAllByRole('option').map((option) => option.textContent);
    expect(names).toEqual(['All formats', 'Demo Format']);
  });
});
