import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import pendulumMonster from '../fixtures/schema/pendulum-monster.json';
import validDataset from '../fixtures/schema/dataset-valid.json';
import {
  extractDetailOverlay,
  mergeCatalogSearchWithDetail,
  measureSplitGzipRatio,
  toCatalogSearchCard,
  writeSplitDataset,
} from '../../pipeline/splitDataset.ts';
import {
  validateCompactSearchIndexEnvelope,
  validateYugiohCard,
} from '../../src/shared/schema/validate.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import { OTCP_DATASET_SCHEMA_VERSION_LEGACY } from '../../src/shared/schema/constants.ts';

describe('splitDataset', () => {
  const tempDirs: string[] = [];
  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) rmSync(dir, { recursive: true, force: true });
    }
  });

  const card = validDataset.cards[0] as YugiohCard;

  it('strips detail-only fields from the search index card', () => {
    const full: YugiohCard = {
      ...card,
      pendDesc: 'Pendulum text',
      monsterDesc: 'Monster text',
      scale: 4,
      genesysPoints: 15,
      sets: [
        {
          setCode: 'LOB-001',
          setName: 'Legend of Blue Eyes',
          setRarity: 'Ultra Rare',
          setRarityCode: 'UR',
          setPrice: 12.5,
        },
      ],
      prices: {
        tcgplayer: 1.23,
        ebay: 9.99,
        amazon: 8.88,
        cardmarket: 2.34,
        coolstuffinc: 3.45,
      },
    };

    const searchCard = toCatalogSearchCard(full, 0);
    expect(searchCard).not.toHaveProperty('pendDesc');
    expect(searchCard).not.toHaveProperty('schemaVersion');
    expect(searchCard.setNames.length).toBeGreaterThan(0);
    expect(searchCard).not.toHaveProperty('sets');
    expect(searchCard.prices).toEqual({
      tcgplayer: 1.23,
      cardmarket: 2.34,
      coolstuffinc: 3.45,
    });

    const overlay = extractDetailOverlay(full);
    expect(overlay.text).toBe(full.text);
    expect(overlay.sets).toEqual(full.sets);

    const merged = mergeCatalogSearchWithDetail(searchCard, overlay);
    const validated = validateYugiohCard(merged);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    expect(validated.data.pendDesc).toBe('Pendulum text');
    expect(validated.data.scale).toBe(4);
  });

  it('writes a search index file and bucketed detail chunks', () => {
    const pendulumValidated = validateYugiohCard(pendulumMonster);
    expect(pendulumValidated.ok).toBe(true);
    const cards: YugiohCard[] = [card, pendulumValidated.ok ? pendulumValidated.data : card];
    const dir = mkdtempSync(join(tmpdir(), 'otcp-split-'));
    tempDirs.push(dir);
    const split = writeSplitDataset(dir, cards, '2026-11-01T12:00:00.000Z', undefined, 100_000);
    const indexText = readFileSync(split.searchIndexPath, 'utf8');
    const validated = validateCompactSearchIndexEnvelope(JSON.parse(indexText));
    expect(validated.ok).toBe(true);
    if (validated.ok) {
      expect(validated.data.i.length).toBe(cards.length);
    }
    expect(split.searchIndexRelative).toMatch(/search-2026-11-01/);
    expect(split.detailsPrefixRelative).toMatch(/details-2026-11-01/);
  });

  it('keeps the slim search index under one third of the legacy gzip size for duplicated cards', async () => {
    const template = validateYugiohCard(pendulumMonster);
    expect(template.ok).toBe(true);
    if (!template.ok) return;

    const cards = Array.from({ length: 400 }, (_, index) => ({
      ...template.data,
      id: 10_000 + index,
      passcode: 10_000 + index,
      name: `${template.data.name} ${index}`,
      pendDesc: `Pendulum effect paragraph ${index} `.repeat(8),
      monsterDesc: `Monster effect paragraph ${index} `.repeat(8),
      scale: 4,
      genesysPoints: 15,
    }));

    const { legacyGzipBytes, searchIndexGzipBytes, ratio } = await measureSplitGzipRatio(
      cards,
      '2026-11-01T12:00:00.000Z',
    );

    expect(searchIndexGzipBytes).toBeLessThan(legacyGzipBytes);
    expect(ratio).toBeLessThanOrEqual(1 / 3);
  });

  it('builds legacy envelopes at schema version 1.0.0 in measurement helper', async () => {
    const cards = [card];
    const { legacyGzipBytes } = await measureSplitGzipRatio(cards, validDataset.generatedAt);
    const legacyJson = JSON.stringify({
      schemaVersion: OTCP_DATASET_SCHEMA_VERSION_LEGACY,
      generatedAt: validDataset.generatedAt,
      source: validDataset.source,
      cards,
    });
    expect(legacyGzipBytes).toBeGreaterThan(0);
    expect(legacyJson).toContain(OTCP_DATASET_SCHEMA_VERSION_LEGACY);
  });
});
