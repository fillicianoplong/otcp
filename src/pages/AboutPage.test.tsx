/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AboutPage } from './AboutPage.tsx';

afterEach(() => {
  cleanup();
});

describe('AboutPage', () => {
  it('credits card data and images without placeholder text', () => {
    render(<AboutPage />);

    expect(screen.queryByText('Attribution to be added')).toBeNull();

    const section = screen
      .getByRole('heading', { name: 'Card data and images' })
      .closest('section');
    expect(section).not.toBeNull();

    const ygoprodeckLink = within(section!).getByRole('link', { name: 'YGOPRODeck' });
    expect(ygoprodeckLink.getAttribute('href')).toBe('https://ygoprodeck.com/api-guide/');
    expect(ygoprodeckLink.getAttribute('target')).toBe('_blank');
    expect(ygoprodeckLink.getAttribute('rel')).toBe('noopener noreferrer');

    expect(within(section!).getByText(/re-hosts them so pages load faster/i)).toBeTruthy();
    expect(
      within(section!).getByText(/unofficial fan project and is not affiliated with or endorsed/i),
    ).toBeTruthy();
    expect(within(section!).queryByRole('list')).toBeNull();
  });
});
