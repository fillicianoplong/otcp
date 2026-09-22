import { describe, expect, it } from 'vitest';

import {
  lookupBanlistSnapshotCard,
  resolveSnapshotBanStatus,
} from '../../src/format/banlistSnapshots.ts';
import { resolveFormatBanStatus } from '../../src/format/formatBanStatus.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

function minimalCard(overrides: Partial<YugiohCard> & Pick<YugiohCard, 'id' | 'name'>): YugiohCard {
  return {
    schemaVersion: '1.0.0',
    type: 'Monster',
    text: '',
    images: { small: '/s.webp', large: '/l.webp' },
    sets: [],
    race: 'Warrior',
    ...overrides,
  };
}

describe('banlistSnapshots', () => {
  it('loads GOAT Forbidden status for Chaos Emperor Dragon by card id', () => {
    expect(resolveSnapshotBanStatus('goat', 82301904, 82301904)).toBe('Forbidden');
    expect(lookupBanlistSnapshotCard('goat', { passcode: '82301904' })?.status).toBe('forbidden');
  });

  it('loads HAT Limited status by passcode with leading zeros', () => {
    const row = lookupBanlistSnapshotCard('hat', { passcode: '01475311' });
    expect(row?.name).toBe('Allure of Darkness');
    expect(row?.status).toBe('limited');
  });

  it('returns null for cards not on the Tengu snapshot', () => {
    expect(resolveSnapshotBanStatus('tengu', 99999999, undefined)).toBeNull();
  });

  it('does not list Morphing Jar #2 on the Tengu snapshot (G-01)', () => {
    expect(lookupBanlistSnapshotCard('tengu', { cardId: 79106360 })).toBeUndefined();
  });
});

describe('formatBanStatus with curated snapshots', () => {
  it('uses the GOAT snapshot instead of current TCG banlist_info', () => {
    const card = minimalCard({
      id: 82301904,
      name: 'Chaos Emperor Dragon - Envoy of the End',
    });
    expect(resolveFormatBanStatus(card, 'goat')).toBe('Forbidden');
  });
});
