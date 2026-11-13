/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { PriceView } from '../../src/components/PriceView.tsx';

afterEach(() => {
  cleanup();
});

function renderPriceView(props: Parameters<typeof PriceView>[0]): ReturnType<typeof render> {
  return render(createElement(PriceView, props));
}

describe('PriceView', () => {
  it('renders each store on one compact row with price and store link', () => {
    renderPriceView({
      cardName: 'Dark Magician',
      snapshotAt: '2026-10-28T12:00:00.000Z',
      prices: {
        tcgplayer: 1.23,
        coolstuffinc: 1.1,
        cardmarket: 0.95,
      },
    });

    expect(screen.getByRole('heading', { name: 'Prices' })).toBeTruthy();
    expect(screen.getByText('TCGplayer')).toBeTruthy();
    expect(screen.getByText('$1.23')).toBeTruthy();
    expect(screen.getByText('CoolStuffInc')).toBeTruthy();
    expect(screen.getByText('$1.10')).toBeTruthy();
    expect(screen.getByText('Cardmarket')).toBeTruthy();
    expect(screen.getByText('€0.95')).toBeTruthy();

    expect(screen.getByRole('link', { name: 'Open on TCGplayer' }).getAttribute('href')).toBe(
      'https://www.tcgplayer.com/search/yugioh/product?q=Dark%20Magician',
    );
    expect(screen.getByRole('link', { name: 'Open on CoolStuffInc' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open on Cardmarket' })).toBeTruthy();
    expect(screen.getByText(/as of Oct 28, 2026/)).toBeTruthy();
  });

  it('shows an em dash for a zero price and keeps the store link', () => {
    renderPriceView({
      cardName: 'Test Card',
      snapshotAt: '2026-10-28T12:00:00.000Z',
      prices: { tcgplayer: 0, coolstuffinc: 2, cardmarket: undefined },
    });

    const tcgRow = screen.getByText('TCGplayer').closest('div');
    expect(tcgRow?.textContent).toContain('—');
    expect(tcgRow?.textContent).not.toContain('$0.00');
    expect(screen.getByRole('link', { name: 'Open on TCGplayer' })).toBeTruthy();
  });
});
