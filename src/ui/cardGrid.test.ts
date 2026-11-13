import { describe, expect, it } from 'vitest';

import { cardGridClassName } from './cardGridLayout.ts';

describe('cardGridClassName', () => {
  it('keeps search at four columns on a phone and six on desktop', () => {
    const className = cardGridClassName('search');
    expect(className).toContain('min-[360px]:grid-cols-4');
    expect(className).toContain('lg:grid-cols-6');
  });

  it('uses four columns for the side search and for Lists and Collection', () => {
    expect(cardGridClassName('library')).toContain('grid-cols-4');
    expect(cardGridClassName('lists')).toContain('grid-cols-4');
  });

  it('uses four columns on a phone deck list and ten on desktop', () => {
    const className = cardGridClassName('deck');
    expect(className).toContain('grid-cols-4');
    expect(className).toContain('lg:grid-cols-10');
  });
});
