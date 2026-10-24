/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { FormatDetailFactsBlock } from './FormatDetailFactsBlock.tsx';
import { buildFormatDetailFacts } from './formatDetailFacts.ts';
import { getFormatById } from './formatCatalog.ts';

afterEach(() => {
  cleanup();
});

describe('FormatDetailFactsBlock', () => {
  it('keeps stacked GOAT facts in a full-width box with a 70ch measure and no deck size', () => {
    const format = getFormatById('goat');
    expect(format).toBeDefined();

    render(
      <MemoryRouter>
        <FormatDetailFactsBlock facts={buildFormatDetailFacts(format!)} />
      </MemoryRouter>,
    );

    const aside = screen.getByRole('complementary', { name: 'Format details' });
    expect(aside.className).toContain('w-full');
    expect(aside.firstElementChild?.className).toContain('max-w-[70ch]');
    expect(
      within(aside)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual([
      'Effective',
      'Ban list',
      'Cards released by',
      'Latest set',
      'Not included',
      'Sources',
    ]);
    expect(within(aside).queryByText('Deck size')).toBeNull();
  });
});
