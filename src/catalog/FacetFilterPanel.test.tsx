/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import sampleDataset from '../../public/data/datasets/sample-dev.json';
import type { YugiohCard } from '../shared/schema/card.ts';
import { FacetFilterPanel } from './FacetFilterPanel.tsx';
import { FilterEngine, emptyFilterState } from './filterEngine.ts';

const sampleCards = sampleDataset.cards as YugiohCard[];

afterEach(() => {
  cleanup();
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
