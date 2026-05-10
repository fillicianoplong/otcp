import { describe, expect, it } from 'vitest';

import {
  banMarkerForStatus,
  isFormatBanContextActive,
  resolveCardBanForFormat,
} from '../../src/catalog/formatBanContext.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

const limitedMonster: YugiohCard = {
  schemaVersion: '1.0.0',
  id: 83764719,
  name: 'Monster Reborn',
  type: 'Spell Card',
  text: '',
  images: { small: '/s.webp', large: '/l.webp' },
  sets: [],
  race: 'Normal',
  banlistInfo: { banTcg: 'Limited' },
};

describe('formatBanContext', () => {
  it('treats empty format param as inactive', () => {
    expect(isFormatBanContextActive(null)).toBe(false);
    expect(isFormatBanContextActive('')).toBe(false);
    expect(resolveCardBanForFormat(limitedMonster, null)).toBeNull();
  });

  it('returns ban status when a format is active', () => {
    expect(resolveCardBanForFormat(limitedMonster, 'tcg')).toBe('Limited');
    expect(resolveCardBanForFormat(limitedMonster, 'ocg')).toBeNull();
  });

  it('maps ban markers to compact glyphs', () => {
    expect(banMarkerForStatus('Limited').glyph).toBe('1');
    expect(banMarkerForStatus('Semi-Limited').glyph).toBe('2');
    expect(banMarkerForStatus('Forbidden').glyph).toBe('⊘');
  });
});
