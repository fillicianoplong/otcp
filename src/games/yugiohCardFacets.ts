import type { FacetFieldId } from '../catalog/facets.ts';
import { resolveFormatBanStatus } from '../format/formatBanStatus.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import type { FacetFieldIndexer, GameNumericRange } from './types.ts';

const STAT_BUCKETS: readonly { id: string; matches: (n: number) => boolean }[] = [
  { id: '?', matches: (n) => n < 0 },
  { id: '0', matches: (n) => n === 0 },
  { id: '1-1000', matches: (n) => n >= 1 && n <= 1000 },
  { id: '1001-2000', matches: (n) => n >= 1001 && n <= 2000 },
  { id: '2001-3000', matches: (n) => n >= 2001 && n <= 3000 },
  { id: '3001+', matches: (n) => n >= 3001 },
];

function statBucket(n: number): string {
  for (const bucket of STAT_BUCKETS) {
    if (bucket.matches(n)) return bucket.id;
  }
  return '3001+';
}

function typeTokens(type: string): readonly string[] {
  return type.split(/\s+/).filter((part) => part.length > 0);
}

/** Monster card type facet values (excludes Spell/Trap/Skill and the Monster suffix). */
export function monsterFrameFacetValues(card: YugiohCard): readonly string[] {
  if (card.type.includes('Spell') || card.type.includes('Trap')) return [];
  if (card.type.includes('Skill')) return [];
  return typeTokens(card.type).filter((part) => part !== 'Monster');
}

export function cardLevelMetric(card: YugiohCard): number | null {
  if (card.level != null) return card.level;
  if (card.rank != null) return card.rank;
  if (card.linkRating != null) return card.linkRating;
  return null;
}

function levelFacetValues(card: YugiohCard): readonly string[] {
  const metric = cardLevelMetric(card);
  return metric != null ? [String(metric)] : [];
}

export function yugiohBanStatusValue(card: YugiohCard, formatParam: string): string {
  return resolveFormatBanStatus(card, formatParam) ?? 'Unlimited';
}

function hasHostedImage(card: YugiohCard): string {
  const small = card.images.small;
  if (!small || small.includes('placeholder')) return 'no';
  return 'yes';
}

function setNamesForCard(card: YugiohCard): readonly string[] {
  if ('setNames' in card && Array.isArray(card.setNames)) {
    return card.setNames as readonly string[];
  }
  const names = new Set<string>();
  for (const entry of card.sets) {
    const name = entry.setName?.trim();
    if (name) names.add(name);
  }
  return [...names];
}

function raritiesForCard(card: YugiohCard): readonly string[] {
  if ('rarities' in card && Array.isArray(card.rarities)) {
    return card.rarities as readonly string[];
  }
  return card.sets.map((set) => set.setRarity);
}

function compareLevelValues(left: string, right: string): number {
  return Number(left) - Number(right) || left.localeCompare(right);
}

/** Inverted-bitset fields for Yu-Gi-Oh!. Price and legality are applied separately. */
export const YUGIOH_FIELD_INDEXERS: readonly FacetFieldIndexer[] = [
  { id: 'cardType', valuesForRow: (card) => (card.type ? [card.type] : []) },
  { id: 'set', valuesForRow: (card) => setNamesForCard(card) },
  { id: 'rarity', valuesForRow: (card) => raritiesForCard(card) },
  { id: 'hasImage', valuesForRow: (card) => [hasHostedImage(card)] },
  { id: 'monsterFrame', valuesForRow: (card) => monsterFrameFacetValues(card) },
  { id: 'attribute', valuesForRow: (card) => (card.attribute ? [card.attribute] : []) },
  { id: 'race', valuesForRow: (card) => (card.race ? [card.race] : []) },
  { id: 'archetype', valuesForRow: (card) => (card.archetype ? [card.archetype] : []) },
  {
    id: 'level',
    valuesForRow: (card) => levelFacetValues(card),
    compareValues: compareLevelValues,
  },
  {
    id: 'atk',
    valuesForRow: (card) => (typeof card.atk === 'number' ? [statBucket(card.atk)] : []),
  },
  {
    id: 'def',
    valuesForRow: (card) => (typeof card.def === 'number' ? [statBucket(card.def)] : []),
  },
  { id: 'linkMarker', valuesForRow: (card) => card.linkMarkers ?? [] },
];

export function yugiohRowMatchesLevelTokens(card: YugiohCard, tokens: readonly string[]): boolean {
  for (const token of tokens) {
    const range = /^(\d+)-(\d+)$/.exec(token);
    if (range) {
      const min = Number(range[1]);
      const max = Number(range[2]);
      const numeric = cardLevelMetric(card);
      if (numeric != null && numeric >= min && numeric <= max) return true;
      continue;
    }
    const legacy = /^(?:Level|Rank|Link)-(\d+)$/.exec(token);
    const plain = legacy ? legacy[1]! : token;
    if (/^\d+$/.test(plain)) {
      const n = Number(plain);
      if (card.level === n || card.rank === n || card.linkRating === n) return true;
      continue;
    }
    if (levelFacetValues(card).includes(token)) return true;
  }
  return false;
}

function cardPriceDollars(card: YugiohCard): number | null {
  const price = card.prices?.tcgplayer;
  if (price == null) return null;
  return price;
}

function inNumericRange(value: number, range: GameNumericRange): boolean {
  if (range.min != null && value < range.min) return false;
  if (range.max != null && value > range.max) return false;
  return true;
}

export function yugiohRowMatchesRange(
  card: YugiohCard,
  fieldId: FacetFieldId,
  range: GameNumericRange,
): boolean {
  if (range.min == null && range.max == null) return true;
  if (fieldId === 'price') {
    const dollars = cardPriceDollars(card);
    if (dollars == null) return false;
    return inNumericRange(dollars, range);
  }
  if (fieldId === 'atk') {
    if (typeof card.atk !== 'number') return false;
    return inNumericRange(card.atk, range);
  }
  if (fieldId === 'def') {
    if (typeof card.def !== 'number') return false;
    return inNumericRange(card.def, range);
  }
  if (fieldId === 'level') {
    const metric = cardLevelMetric(card);
    if (metric == null) return false;
    return inNumericRange(metric, range);
  }
  return true;
}
