import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const spikeDir = join(dirname(fileURLToPath(import.meta.url)), '../../spikes/s03');

type SnapshotCard = {
  id: number;
  passcode: string;
  name: string;
  status: string;
  note: string;
};

type Snapshot = {
  formatId: string;
  effectiveDate: string;
  source: { url: string };
  cardPool: { sourceUrl: string };
  cards: SnapshotCard[];
};

type GapItem = {
  gapId: string;
  flag: string;
  status?: string;
  detail: string;
  inSnapshot: boolean;
};

const statuses = new Set(['forbidden', 'limited', 'semi-limited']);

function loadSnapshot(name: string): Snapshot {
  return JSON.parse(readFileSync(join(spikeDir, name), 'utf8')) as Snapshot;
}

describe('s03 banlist snapshots', () => {
  const goat = loadSnapshot('goat.json');
  const hat = loadSnapshot('hat.json');
  const tengu = loadSnapshot('tengu.json');

  it('gives every row an id, an 8-digit passcode, a name, and a status', () => {
    for (const snapshot of [goat, hat, tengu]) {
      expect(snapshot.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(snapshot.source.url).toMatch(/^https:\/\//);
      expect(snapshot.cardPool.sourceUrl).toMatch(/^https:\/\//);
      const ids = new Set<number>();
      for (const card of snapshot.cards) {
        expect(statuses.has(card.status)).toBe(true);
        expect(card.passcode).toBe(String(card.id).padStart(8, '0'));
        expect(card.name.length).toBeGreaterThan(0);
        expect(typeof card.note).toBe('string');
        expect(ids.has(card.id)).toBe(false);
        ids.add(card.id);
      }
    }
  });

  it('keeps the checked counts', () => {
    expect(goat.formatId).toBe('goat');
    expect(hat.formatId).toBe('hat');
    expect(tengu.formatId).toBe('tengu');
    expect(goat.cards).toHaveLength(73);
    expect(hat.cards).toHaveLength(162);
    expect(tengu.cards).toHaveLength(134);
    expect(tengu.cards.filter((card) => card.status === 'semi-limited')).toHaveLength(18);
    const pot = goat.cards.find((card) => card.name === 'Pot of Greed');
    expect(pot?.status).toBe('limited');
    expect(pot?.id).toBe(55144522);
  });

  it('leaves Morphing Jar #2 off Tengu and does not keep a bare Magical row', () => {
    expect(tengu.cards.some((card) => card.name === 'Morphing Jar #2')).toBe(false);
    const morphingJar = tengu.cards.find((card) => card.name === 'Morphing Jar');
    expect(morphingJar?.status).toBe('limited');
    expect(morphingJar?.id).toBe(33508719);
    const scientist = tengu.cards.find((card) => card.name === 'Magical Scientist');
    expect(scientist?.status).toBe('forbidden');
    expect(scientist?.id).toBe(34206604);
    expect(tengu.cards.some((card) => card.name === 'Magical')).toBe(false);
    expect(tengu.cards.some((card) => card.name === 'Elemental HERO Grand Neos')).toBe(false);
  });

  it('ships a gap list with a flag on every item and no unmatched passcode', () => {
    const gaps = JSON.parse(readFileSync(join(spikeDir, 'gaps.json'), 'utf8')) as {
      unmatchedPasscodes: unknown[];
      items: GapItem[];
    };
    expect(gaps.unmatchedPasscodes).toEqual([]);
    const flags = new Set(['unmatched', 'disputed', 'uncertain']);
    expect(gaps.items.length).toBeGreaterThan(0);
    for (const item of gaps.items) {
      expect(item.gapId).toMatch(/^G-\d{2}$/);
      expect(flags.has(item.flag)).toBe(true);
      expect(item.detail.length).toBeGreaterThan(0);
    }
    const jar = gaps.items.find((item) => item.gapId === 'G-01');
    expect(jar?.status).toBe('resolved');
    expect(jar?.inSnapshot).toBe(false);
    const openDisputed = gaps.items.filter(
      (item) => item.flag === 'disputed' && item.status !== 'resolved',
    );
    expect(openDisputed.map((item) => item.gapId)).toEqual(['G-02']);
    expect(openDisputed[0]?.inSnapshot).toBe(false);
  });
});
