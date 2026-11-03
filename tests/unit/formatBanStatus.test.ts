import { describe, expect, it } from 'vitest';

import {
  maxCopiesForCardInFormat,
  resolveAdvancedBanStatus,
  resolveFormatBanStatus,
} from '../../src/format/formatBanStatus.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

function cardWithTcgBan(status: 'Forbidden' | 'Limited' | 'Semi-Limited'): YugiohCard {
  return {
    schemaVersion: '1.0.0',
    id: 12345678,
    name: 'Sample Card',
    type: 'Spell Card',
    text: '',
    images: { small: '/s.webp', large: '/l.webp' },
    sets: [],
    race: 'Normal',
    banlistInfo: { banTcg: status },
  };
}

describe('formatBanStatus', () => {
  it('reads Advanced status from the current TCG list', () => {
    const forbidden = cardWithTcgBan('Forbidden');
    expect(resolveAdvancedBanStatus(forbidden)).toBe('Forbidden');
    expect(resolveFormatBanStatus(forbidden, 'advanced')).toBe('Forbidden');
    expect(maxCopiesForCardInFormat(forbidden, 'advanced')).toBe(0);
  });

  it('maps Advanced Forbidden to Limited under Traditional (FR-15)', () => {
    const forbidden = cardWithTcgBan('Forbidden');
    expect(resolveFormatBanStatus(forbidden, 'traditional')).toBe('Limited');
    expect(maxCopiesForCardInFormat(forbidden, 'traditional')).toBe(1);
  });

  it('keeps Semi-Limited and Limited unchanged in Traditional', () => {
    const limited = cardWithTcgBan('Limited');
    expect(resolveFormatBanStatus(limited, 'traditional')).toBe('Limited');
    expect(maxCopiesForCardInFormat(limited, 'traditional')).toBe(1);

    const semi = cardWithTcgBan('Semi-Limited');
    expect(resolveFormatBanStatus(semi, 'traditional')).toBe('Semi-Limited');
    expect(maxCopiesForCardInFormat(semi, 'traditional')).toBe(2);
  });

  it('returns null for unlimited cards', () => {
    const unlimited: YugiohCard = {
      ...cardWithTcgBan('Limited'),
      banlistInfo: undefined,
    };
    expect(resolveFormatBanStatus(unlimited, 'advanced')).toBeNull();
  });
});
