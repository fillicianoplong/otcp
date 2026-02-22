#!/usr/bin/env node
import { validateDatasetEnvelope } from '../src/shared/schema/validate.ts';

type PublishedPointer = {
  schemaVersion: string;
  datasetFile: string;
  sha256: string;
  publishedAt: string;
  cardCount: number;
};

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('BASE_URL is required.');
  }
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

function siteUrl(base: string, path: string): string {
  const withoutLeadingSlash = path.replace(/^\//, '');
  return new URL(withoutLeadingSlash, base).href;
}

function isSamplePointer(pointer: PublishedPointer): boolean {
  return (
    pointer.datasetFile.includes('sample-dev') ||
    pointer.cardCount <= 4 ||
    pointer.datasetFile.endsWith('/sample-dev.json')
  );
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} failed (${response.status}).`);
  }
  return response.json() as Promise<unknown>;
}

async function main(): Promise<void> {
  const base = normalizeBaseUrl(process.env.BASE_URL ?? '');
  const pointerUrl = siteUrl(base, 'data/current.json');
  const pointer = (await fetchJson(pointerUrl)) as PublishedPointer;

  if (typeof pointer.datasetFile !== 'string' || pointer.datasetFile.length === 0) {
    throw new Error('current.json is missing datasetFile.');
  }

  const datasetUrl = siteUrl(base, pointer.datasetFile);
  const datasetJson = await fetchJson(datasetUrl);
  const validated = validateDatasetEnvelope(datasetJson);
  if (!validated.ok) {
    throw new Error('Published dataset failed schema validation.');
  }

  console.log(
    `Published dataset OK (${validated.data.cards.length} cards, pointer ${pointer.datasetFile}).`,
  );

  if (isSamplePointer(pointer)) {
    console.log('Sample pointer still live; skipping image and full-count checks.');
    return;
  }

  if (validated.data.cards.length < pointer.cardCount) {
    throw new Error(
      `Dataset card count (${validated.data.cards.length}) is below pointer cardCount (${pointer.cardCount}).`,
    );
  }

  const firstWithArt = validated.data.cards.find(
    (card) => typeof card.images?.small === 'string' && card.images.small.length > 0,
  );
  if (!firstWithArt?.images?.small) {
    throw new Error('No card image URL found in the published dataset.');
  }

  const imagePath = firstWithArt.images.small.replace(/^\/otcp\//, '');
  const imageUrl = siteUrl(base, imagePath);
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Card image GET ${imageUrl} failed (${imageResponse.status}).`);
  }

  console.log(`Card image OK (${imageUrl}).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
