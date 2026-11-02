import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearCardDetailChunkCache,
  fetchCardDetailRecord,
} from '../../src/catalog/loadCardDetail.ts';
import { toCatalogSearchCard } from '../../pipeline/splitDataset.ts';
import { OTCP_DATASET_SCHEMA_VERSION } from '../../src/shared/schema/constants.ts';
import validDataset from '../fixtures/schema/dataset-valid.json';
import pendulumMonster from '../fixtures/schema/pendulum-monster.json';
import { validateYugiohCard } from '../../src/shared/schema/validate.ts';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  clearCardDetailChunkCache();
  vi.unstubAllGlobals();
});

describe('loadCardDetail', () => {
  it('merges a detail chunk overlay onto the search card', async () => {
    const searchCard = {
      id: validDataset.cards[0].id,
      name: validDataset.cards[0].name,
      type: validDataset.cards[0].type,
      text: '',
      images: {
        small: validDataset.cards[0].images.small,
        large: validDataset.cards[0].images.small,
      },
      setNames: [],
      rarities: [],
      detailBucket: 0,
      passcode: validDataset.cards[0].passcode,
      attribute: validDataset.cards[0].attribute,
      level: validDataset.cards[0].level,
      atk: validDataset.cards[0].atk,
      def: validDataset.cards[0].def,
      race: validDataset.cards[0].race,
      archetype: validDataset.cards[0].archetype,
    } as import('../../src/shared/schema/catalogSearch.ts').CatalogSearchCard;

    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('bucket-00000.json')) {
        return jsonResponse({
          schemaVersion: OTCP_DATASET_SCHEMA_VERSION,
          bucket: 0,
          cards: {
            '89631139': {
              text: validDataset.cards[0].text,
              pendDesc: 'Extra pendulum line',
              monsterDesc: 'Extra monster line',
            },
          },
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const merged = await fetchCardDetailRecord(
      searchCard,
      {
        detailsPrefix: 'data/datasets/details-test/',
        detailsBucketSize: 1000,
        detailBucketCount: 1,
      },
      fetchImpl as unknown as typeof fetch,
    );

    expect(merged.pendDesc).toBe('Extra pendulum line');
    expect(merged.monsterDesc).toBe('Extra monster line');
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('caches detail chunks for cards in the same bucket', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        schemaVersion: OTCP_DATASET_SCHEMA_VERSION,
        bucket: 0,
        cards: {
          '718463': {
            genesysPoints: 20,
          },
        },
      }),
    );

    const source = {
      detailsPrefix: 'data/datasets/details-test/',
      detailsBucketSize: 1000,
      detailBucketCount: 1,
    };
    const validated = validateYugiohCard(pendulumMonster);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const searchCard = toCatalogSearchCard(validated.data, 0);

    await fetchCardDetailRecord(searchCard, source, fetchImpl as unknown as typeof fetch);
    await fetchCardDetailRecord(searchCard, source, fetchImpl as unknown as typeof fetch);

    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
