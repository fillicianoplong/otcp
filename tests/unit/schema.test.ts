import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  OTCP_CARD_SCHEMA_VERSION,
  otcpCardCoreSchema,
  validateDatasetEnvelope,
  validateYugiohCard,
  yugiohCardExtensionSchema,
} from '../../src/shared/schema/index.ts';

const fixtureDir = join(process.cwd(), 'tests/fixtures/schema');

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtureDir, name), 'utf8')) as unknown;
}

describe('SchemaCore Yu-Gi-Oh! cards', () => {
  it.each([
    ['monster-normal.json'],
    ['spell.json'],
    ['trap.json'],
    ['link-monster.json'],
    ['pendulum-monster.json'],
  ])('accepts a valid fixture %s', (fileName) => {
    const card = loadFixture(fileName);
    const result = validateYugiohCard(card);
    expect(result.ok, result.ok ? '' : JSON.stringify(result.errors)).toBe(true);
  });

  it('rejects an unknown field on a card', () => {
    const result = validateYugiohCard(loadFixture('invalid-unknown-field.json'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((issue) => issue.code === 'unrecognized_keys')).toBe(true);
  });

  it('rejects a missing required field on a card', () => {
    const result = validateYugiohCard(loadFixture('invalid-missing-name.json'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((issue) => issue.path === 'name')).toBe(true);
  });

  it('keeps Yu-Gi-Oh! fields out of the shared core schema', () => {
    const coreKeys = Object.keys(otcpCardCoreSchema.shape).sort();
    const extensionKeys = Object.keys(yugiohCardExtensionSchema.shape).sort();
    expect(coreKeys).toEqual([
      'id',
      'images',
      'name',
      'prices',
      'schemaVersion',
      'sets',
      'text',
      'type',
    ]);
    expect(extensionKeys).toContain('attribute');
    expect(extensionKeys).toContain('passcode');
    expect(extensionKeys).not.toContain('schemaVersion');
  });

  it('pins the card schema version constant to the fixture literal', () => {
    const card = loadFixture('monster-normal.json') as { schemaVersion: string };
    expect(card.schemaVersion).toBe(OTCP_CARD_SCHEMA_VERSION);
  });
});

describe('SchemaCore dataset envelope', () => {
  it('accepts a valid published dataset fixture', () => {
    const result = validateDatasetEnvelope(loadFixture('dataset-valid.json'));
    expect(result.ok, result.ok ? '' : JSON.stringify(result.errors)).toBe(true);
  });
});
