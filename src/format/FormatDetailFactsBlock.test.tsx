/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { buildCardDetailSetSearchHref } from '../catalog/cardDetailSets.ts';
import { FormatDetailFactsBlock } from './FormatDetailFactsBlock.tsx';
import { buildFormatDetailFacts } from './formatDetailFacts.ts';
import { getFormatById } from './formatCatalog.ts';

afterEach(() => {
  cleanup();
});

describe('FormatDetailFactsBlock', () => {
  it('shows GOAT facts as info cards and does not render the description', () => {
    const format = getFormatById('goat');
    expect(format).toBeDefined();
    const facts = buildFormatDetailFacts(format!);
    expect(facts.description).toBeTruthy();

    render(
      <MemoryRouter>
        <FormatDetailFactsBlock facts={facts} formatId="goat" />
      </MemoryRouter>,
    );

    const aside = screen.getByRole('complementary', { name: 'Format details' });
    expect(aside.querySelector('dl')?.className).toContain('grid-cols-2');
    expect(aside.querySelector('dl')?.className).toContain('auto-fit');
    expect(aside.textContent).not.toContain(facts.description);
    expect(within(aside).queryByText('Sources')).toBeNull();
    expect(
      within(aside)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['Ban list', 'Effective', 'Cards released by', 'Latest set', 'Not included']);
    const hrefFor = (label: string) =>
      within(aside)
        .getByRole('link', { name: new RegExp(`^${label}\\b`) })
        .getAttribute('href');
    expect(hrefFor('Ban list')).toBe('/search?format=goat');
    expect(hrefFor('Effective')).toBe('/search?format=goat');
    expect(hrefFor('Cards released by')).toBe('/search?format=goat');
    expect(hrefFor('Latest set')).toBe(buildCardDetailSetSearchHref('Dark Beginning 2'));
    expect(hrefFor('Not included')).toBe(buildCardDetailSetSearchHref('Cybernetic Revolution'));
    expect(within(aside).getByText('April 2005 TCG')).toBeTruthy();
    expect(within(aside).queryByText('Deck size')).toBeNull();
  });
});
