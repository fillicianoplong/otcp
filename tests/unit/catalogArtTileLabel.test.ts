import { describe, expect, it } from 'vitest';

import { catalogGridTileAriaLabel } from '../../src/catalog/catalogArtTileLabel.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

const card: YugiohCard = {
  schemaVersion: '1.0.0',
  id: 46986420,
  name: 'Dark Magician',
  type: 'Normal Monster',
  text: '',
  images: { small: 'https://example.test/s.webp', large: 'https://example.test/l.webp' },
  sets: [],
  artIds: [46986420, 46986421, 46986414],
};

describe('catalogGridTileAriaLabel', () => {
  it('names the default-art tile exactly as the card', () => {
    expect(catalogGridTileAriaLabel(card, 46986420)).toBe('Dark Magician');
  });

  it('names alternate-art tiles with artwork index labels', () => {
    expect(catalogGridTileAriaLabel(card, 46986421)).toBe('Dark Magician, artwork 2 of 3');
    expect(catalogGridTileAriaLabel(card, 46986414)).toBe('Dark Magician, artwork 3 of 3');
  });
});
