import type { YugiohCard } from '../shared/schema/card.ts';
import { normalizeGenesysCardName } from './genesysKonamiPoints.ts';

/** Stable negative id for Konami list rows missing from the published catalog. */
export function stableGenesysPlaceholderId(name: string): number {
  const normalized = normalizeGenesysCardName(name);
  let hash = 5381;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 33) ^ normalized.charCodeAt(index);
  }
  return -((hash >>> 0) % 900_000_000) - 1;
}

export function isGenesysPlaceholderCardId(id: number): boolean {
  return id < 0;
}

export function buildGenesysPlaceholderCard(name: string, points: number): YugiohCard {
  return {
    schemaVersion: '1.0.0',
    id: stableGenesysPlaceholderId(name),
    name,
    type: 'Card',
    text: '',
    images: { small: '', large: '' },
    sets: [],
    genesysPoints: points,
  };
}
