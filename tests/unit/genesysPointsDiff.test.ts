import { describe, expect, it } from 'vitest';

import { computeGenesysPointsDiff } from '../../pipeline/genesysPointsDiff.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

function card(partial: Partial<YugiohCard> & Pick<YugiohCard, 'id' | 'name'>): YugiohCard {
  return {
    schemaVersion: '1.0.0',
    type: 'Spell Card',
    text: '',
    images: { small: '/s.webp', large: '/l.webp' },
    sets: [],
    ...partial,
  };
}

describe('computeGenesysPointsDiff', () => {
  it('reports a forced Konami mismatch without changing ingest values', () => {
    const ash = card({
      id: 14558127,
      name: 'Ash Blossom & Joyous Spring',
      genesysPoints: 20,
    });
    const report = computeGenesysPointsDiff([ash]);
    expect(report.diffCount).toBeGreaterThanOrEqual(1);
    const mismatch = report.diffs.find((entry) => entry.kind === 'point-mismatch');
    expect(mismatch?.ingestPoints).toBe(20);
    expect(mismatch?.konamiPoints).toBe(18);
    expect(ash.genesysPoints).toBe(20);
  });

  it('returns no diffs when ingest matches Konami for a listed card', () => {
    const ash = card({
      id: 14558127,
      name: 'Ash Blossom & Joyous Spring',
      genesysPoints: 18,
    });
    const report = computeGenesysPointsDiff([ash]);
    expect(report.diffs.some((entry) => entry.cardId === ash.id)).toBe(false);
  });
});
