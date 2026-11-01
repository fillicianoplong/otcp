import type { YugiohCard } from '../shared/schema/card.ts';
import {
  andInPlace,
  andPopcount,
  filledMask,
  forEachSetBit,
  orInPlace,
  popcount,
  setBit,
  wordCount,
} from '../search/bitset.ts';
import {
  FACET_FIELDS,
  type FacetDefinition,
  type FacetFieldId,
  facetDefinitionsForGame,
} from './facets.ts';

export const FILTER_STATE_VERSION = 1 as const;

export type FacetMatchMode = 'or' | 'and';

/** Serializable per-field selection (URL-safe JSON). */
export type FacetValueSelection = {
  include?: readonly string[];
  exclude?: readonly string[];
  mode?: FacetMatchMode;
};

export type FilterState = {
  version: typeof FILTER_STATE_VERSION;
  facets: Partial<Record<FacetFieldId, FacetValueSelection>>;
};

export type FilterApplyOptions = {
  /** Restrict to ids from SearchIndex (or another upstream query). */
  searchIds?: readonly number[];
};

export type FilterApplyResult = {
  count: number;
  ids: number[];
};

export type FacetOptionCount = {
  value: string;
  count: number;
};

export type FacetGroupCounts = {
  fieldId: FacetFieldId;
  options: FacetOptionCount[];
};

type IndexedField = {
  id: FacetFieldId;
  definition: FacetDefinition;
  values: readonly string[];
  bitsets: Uint32Array[];
  valueIndex: Map<string, number>;
  unionScratch: Uint32Array;
  unionOn: boolean;
  excludeUnionScratch: Uint32Array;
  excludeOn: boolean;
};

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

function levelFacetValues(card: YugiohCard): readonly string[] {
  const out: string[] = [];
  if (card.linkRating != null) out.push(`Link-${card.linkRating}`);
  if (card.rank != null) out.push(`Rank-${card.rank}`);
  if (card.level != null) out.push(`Level-${card.level}`);
  return out;
}

function tcgBanStatus(card: YugiohCard): string {
  return card.banlistInfo?.banTcg ?? 'Unlimited';
}

function hasHostedImage(card: YugiohCard): string {
  const small = card.images.small;
  if (!small || small.includes('placeholder')) return 'no';
  return 'yes';
}

function priceBucket(card: YugiohCard): string | null {
  const price = card.prices?.tcgplayer;
  if (price == null) return null;
  return statBucket(Math.round(price * 100));
}

type FieldIndexer = {
  id: FacetFieldId;
  valuesForRow: (card: YugiohCard) => readonly string[];
};

const FIELD_INDEXERS: readonly FieldIndexer[] = [
  { id: 'cardType', valuesForRow: (card) => (card.type ? [card.type] : []) },
  {
    id: 'set',
    valuesForRow: (card) => card.sets.flatMap((set) => [set.setCode, set.setName]),
  },
  { id: 'rarity', valuesForRow: (card) => card.sets.map((set) => set.setRarity) },
  { id: 'banStatus', valuesForRow: (card) => [tcgBanStatus(card)] },
  { id: 'price', valuesForRow: (card) => (priceBucket(card) ? [priceBucket(card)!] : []) },
  { id: 'hasImage', valuesForRow: (card) => [hasHostedImage(card)] },
  { id: 'monsterFrame', valuesForRow: (card) => typeTokens(card.type) },
  { id: 'attribute', valuesForRow: (card) => (card.attribute ? [card.attribute] : []) },
  { id: 'race', valuesForRow: (card) => (card.race ? [card.race] : []) },
  { id: 'archetype', valuesForRow: (card) => (card.archetype ? [card.archetype] : []) },
  { id: 'level', valuesForRow: (card) => levelFacetValues(card) },
  {
    id: 'atk',
    valuesForRow: (card) => (typeof card.atk === 'number' ? [statBucket(card.atk)] : []),
  },
  {
    id: 'def',
    valuesForRow: (card) => (typeof card.def === 'number' ? [statBucket(card.def)] : []),
  },
  {
    id: 'linkMarker',
    valuesForRow: (card) => card.linkMarkers ?? [],
  },
];

export function emptyFilterState(): FilterState {
  return { version: FILTER_STATE_VERSION, facets: {} };
}

export function isFilterState(value: unknown): value is FilterState {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record.version !== FILTER_STATE_VERSION) return false;
  if (!record.facets || typeof record.facets !== 'object') return false;
  return true;
}

/** JSON.stringify wrapper for URL persistence (issue #26). */
export function serializeFilterState(state: FilterState): string {
  return JSON.stringify(state);
}

export function parseFilterState(raw: string): FilterState {
  const parsed: unknown = JSON.parse(raw);
  if (!isFilterState(parsed)) throw new Error('Invalid filter state');
  return parsed;
}

/**
 * Client-side faceted filter engine (ADR-012).
 * Builds inverted bitsets per facet value and ANDs active groups with include/exclude and OR/AND.
 */
export class FilterEngine {
  readonly count: number;
  readonly definitions: readonly FacetDefinition[];

  private readonly ids: Uint32Array;
  private readonly rowById: Map<number, number>;
  private readonly all: Uint32Array;
  private readonly baseMask: Uint32Array;
  private readonly shownMask: Uint32Array;
  private readonly scratch: Uint32Array;
  private readonly fields: IndexedField[];
  private readonly cardsByRow: YugiohCard[];

  constructor(cards: readonly YugiohCard[]) {
    const definitions = facetDefinitionsForGame('yugioh');
    this.definitions = definitions;

    const ordered = cards.slice().sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
    const count = ordered.length;
    const words = wordCount(count);
    this.count = count;
    this.ids = new Uint32Array(count);
    this.rowById = new Map();
    this.all = filledMask(count, words);
    this.baseMask = new Uint32Array(words);
    this.shownMask = new Uint32Array(words);
    this.scratch = new Uint32Array(words);
    this.cardsByRow = ordered;

    const defById = new Map(definitions.map((def) => [def.id, def]));
    const tables = new Map<FacetFieldId, Map<string, Uint32Array>>();
    for (const field of FACET_FIELDS) tables.set(field, new Map());

    const add = (fieldId: FacetFieldId, value: string, row: number) => {
      const table = tables.get(fieldId);
      if (!table) return;
      let bits = table.get(value);
      if (!bits) {
        bits = new Uint32Array(words);
        table.set(value, bits);
      }
      setBit(bits, row);
    };

    for (let row = 0; row < count; row++) {
      const card = ordered[row];
      this.ids[row] = card.id;
      this.rowById.set(card.id, row);
      for (const indexer of FIELD_INDEXERS) {
        if (!defById.has(indexer.id)) continue;
        for (const value of indexer.valuesForRow(card)) add(indexer.id, value, row);
      }
    }

    this.fields = FIELD_INDEXERS.filter((indexer) => defById.has(indexer.id)).map((indexer) => {
      const table = tables.get(indexer.id) ?? new Map<string, Uint32Array>();
      const values = [...table.keys()].sort();
      return {
        id: indexer.id,
        definition: defById.get(indexer.id)!,
        values,
        bitsets: values.map((value) => table.get(value) ?? new Uint32Array(words)),
        valueIndex: new Map(values.map((value, index) => [value, index])),
        unionScratch: new Uint32Array(words),
        unionOn: false,
        excludeUnionScratch: new Uint32Array(words),
        excludeOn: false,
      };
    });
  }

  /** Apply facet selections, optionally intersecting a search id list. */
  apply(state: FilterState, options: FilterApplyOptions = {}): FilterApplyResult {
    this.fillBaseMask(options.searchIds);
    this.computeMask(state, this.shownMask);
    const ids: number[] = [];
    forEachSetBit(this.shownMask, this.count, (row) => {
      ids.push(this.ids[row]);
    });
    return { count: ids.length, ids };
  }

  /**
   * Live option counts (FR-57). Each group's counts ignore that group's own selection
   * so every option shows how many cards match if it were added.
   */
  recount(state: FilterState, options: FilterApplyOptions = {}): FacetGroupCounts[] {
    this.fillBaseMask(options.searchIds);
    const out: FacetGroupCounts[] = [];
    for (const field of this.fields) {
      this.computeMask(state, this.scratch, field.id);
      const optionsForField: FacetOptionCount[] = [];
      for (let i = 0; i < field.bitsets.length; i++) {
        optionsForField.push({
          value: field.values[i],
          count: andPopcount(this.scratch, field.bitsets[i]),
        });
      }
      out.push({ fieldId: field.id, options: optionsForField });
    }
    return out;
  }

  optionCount(groups: readonly FacetGroupCounts[], fieldId: FacetFieldId, value: string): number {
    for (const group of groups) {
      if (group.fieldId !== fieldId) continue;
      const match = group.options.find((opt) => opt.value === value);
      return match?.count ?? 0;
    }
    return 0;
  }

  private fillBaseMask(searchIds: readonly number[] | undefined): void {
    this.baseMask.set(this.all);
    if (!searchIds) return;
    this.baseMask.fill(0);
    for (const id of searchIds) {
      const row = this.rowById.get(id);
      if (row !== undefined) setBit(this.baseMask, row);
    }
  }

  private computeMask(state: FilterState, target: Uint32Array, skipFieldId?: FacetFieldId): void {
    this.prepareUnions(state);
    target.set(this.baseMask);
    for (const field of this.fields) {
      if (field.id === skipFieldId) continue;
      if (field.unionOn) andInPlace(target, field.unionScratch);
      if (field.excludeOn) {
        for (let i = 0; i < target.length; i++) {
          target[i] = (target[i] & ~field.excludeUnionScratch[i]) >>> 0;
        }
      }
    }
    this.applyDynamicPredicates(state, target, skipFieldId);
  }

  private prepareUnions(state: FilterState): void {
    for (const field of this.fields) {
      const selection = state.facets[field.id];
      field.unionOn = false;
      field.excludeOn = false;
      if (!selection) continue;

      const mode: FacetMatchMode = selection.mode ?? 'or';

      if (selection.include && selection.include.length > 0) {
        if (field.id === 'monsterFrame' && mode === 'and') {
          this.buildFrameAndMask(selection.include, field.unionScratch);
          field.unionOn = popcount(field.unionScratch) > 0;
        } else {
          let started = false;
          for (const value of selection.include) {
            if (field.id === 'monsterFrame') {
              started = this.orFrameKeyword(field, value, started);
              continue;
            }
            const index = field.valueIndex.get(value);
            if (index === undefined) continue;
            const bits = field.bitsets[index];
            if (!started) {
              field.unionScratch.set(bits);
              started = true;
            } else if (mode === 'and') {
              andInPlace(field.unionScratch, bits);
            } else {
              orInPlace(field.unionScratch, bits);
            }
          }
          field.unionOn = started;
        }
      }

      if (selection.exclude && selection.exclude.length > 0) {
        let started = false;
        for (const value of selection.exclude) {
          if (field.id === 'monsterFrame') {
            this.orFrameKeywordInto(field.excludeUnionScratch, value, started);
            started = true;
            continue;
          }
          const index = field.valueIndex.get(value);
          if (index === undefined) continue;
          const bits = field.bitsets[index];
          if (!started) {
            field.excludeUnionScratch.set(bits);
            started = true;
          } else {
            orInPlace(field.excludeUnionScratch, bits);
          }
        }
        field.excludeOn = started;
      }
    }
  }

  private orFrameKeyword(field: IndexedField, keyword: string, started: boolean): boolean {
    const scratch = this.scratch;
    scratch.fill(0);
    for (let row = 0; row < this.count; row++) {
      if (typeTokens(this.cardsByRow[row].type).includes(keyword)) setBit(scratch, row);
    }
    if (!started) {
      field.unionScratch.set(scratch);
      return true;
    }
    orInPlace(field.unionScratch, scratch);
    return true;
  }

  private orFrameKeywordInto(target: Uint32Array, keyword: string, started: boolean): void {
    const scratch = this.scratch;
    scratch.fill(0);
    for (let row = 0; row < this.count; row++) {
      if (typeTokens(this.cardsByRow[row].type).includes(keyword)) setBit(scratch, row);
    }
    if (!started) target.set(scratch);
    else orInPlace(target, scratch);
  }

  private buildFrameAndMask(keywords: readonly string[], out: Uint32Array): void {
    out.set(this.all);
    const scratch = this.scratch;
    for (const keyword of keywords) {
      scratch.fill(0);
      for (let row = 0; row < this.count; row++) {
        if (typeTokens(this.cardsByRow[row].type).includes(keyword)) setBit(scratch, row);
      }
      andInPlace(out, scratch);
    }
  }

  /** Range tokens and link-marker includes that are not single inverted bitsets. */
  private applyDynamicPredicates(
    state: FilterState,
    mask: Uint32Array,
    skipFieldId?: FacetFieldId,
  ): void {
    if (skipFieldId !== 'level') {
      const levelSel = state.facets.level?.include;
      if (levelSel && levelSel.length > 0) {
        forEachSetBit(mask, this.count, (row) => {
          if (!levelMatches(this.cardsByRow[row], levelSel)) this.clearRow(mask, row);
        });
      }
    }

    if (skipFieldId !== 'linkMarker') {
      const linkSel = state.facets.linkMarker?.include;
      if (linkSel && linkSel.length > 0) {
        forEachSetBit(mask, this.count, (row) => {
          const markers = this.cardsByRow[row].linkMarkers ?? [];
          const ok = linkSel.every((arrow) => markers.includes(arrow));
          if (!ok) this.clearRow(mask, row);
        });
      }
    }
  }

  private clearRow(mask: Uint32Array, row: number): void {
    const word = row >>> 5;
    mask[word] = (mask[word] & ~(1 << (row & 31))) >>> 0;
  }
}

function levelMatches(card: YugiohCard, tokens: readonly string[]): boolean {
  for (const token of tokens) {
    const range = /^(\d+)-(\d+)$/.exec(token);
    if (range) {
      const min = Number(range[1]);
      const max = Number(range[2]);
      const numeric = card.level ?? card.rank ?? card.linkRating;
      if (numeric != null && numeric >= min && numeric <= max) return true;
      continue;
    }
    if (/^\d+$/.test(token)) {
      const n = Number(token);
      if (card.level === n || card.rank === n || card.linkRating === n) return true;
      continue;
    }
    if (levelFacetValues(card).includes(token)) return true;
  }
  return false;
}

export function buildFilterEngine(cards: readonly YugiohCard[]): FilterEngine {
  return new FilterEngine(cards);
}
