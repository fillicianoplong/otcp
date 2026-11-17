import { resolveGame } from '../games/registry.ts';
import type { GameDefinition } from '../games/types.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import {
  andInPlace,
  andPopcount,
  filledMask,
  forEachSetBit,
  orInPlace,
  setBit,
  wordCount,
} from '../search/bitset.ts';
import { type FacetDefinition, type FacetFieldId } from './facets.ts';

export const FILTER_STATE_VERSION = 1 as const;

export type FacetMatchMode = 'or' | 'and';

export type FacetNumericRange = {
  min?: number;
  max?: number;
};

/** Serializable per-field selection (URL-safe JSON). */
export type FacetValueSelection = {
  include?: readonly string[];
  exclude?: readonly string[];
  mode?: FacetMatchMode;
  range?: FacetNumericRange;
};

export type FilterState = {
  version: typeof FILTER_STATE_VERSION;
  facets: Partial<Record<FacetFieldId, FacetValueSelection>>;
};

export type FilterStateUpdater = FilterState | ((previous: FilterState) => FilterState);

export function resolveFilterStateUpdater(
  updater: FilterStateUpdater,
  previous: FilterState,
): FilterState {
  return typeof updater === 'function' ? updater(previous) : updater;
}

export type FilterApplyOptions = {
  /** Restrict to ids from SearchIndex (or another upstream query). */
  searchIds?: readonly number[];
  /** When set, Legality facet indexing and filtering use this format's banlist. */
  formatParam?: string | null;
  /** Restrict facet counts and filtering to this format's card pool. */
  poolCatalogIds?: readonly number[];
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

export function filterStateForFormatContext(
  state: FilterState,
  formatParam: string | null | undefined,
  isKnownFormat: (id: string | null | undefined) => boolean = resolveGame(undefined)
    .isKnownFormatId,
): FilterState {
  if (formatParam && isKnownFormat(formatParam)) return state;
  if (!state.facets.banStatus) return state;
  const facets = { ...state.facets };
  delete facets.banStatus;
  return { version: state.version, facets };
}

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
  return normalizeFilterState(parsed);
}

/** Drops legacy per-group AND mode; selections always combine with OR within a group. */
export function normalizeFilterState(state: FilterState): FilterState {
  const facets: FilterState['facets'] = {};
  for (const [fieldId, selection] of Object.entries(state.facets) as [
    FacetFieldId,
    FilterState['facets'][FacetFieldId],
  ][]) {
    if (!selection) continue;
    const next: FacetValueSelection = {
      include: selection.include ? [...selection.include] : undefined,
      exclude: selection.exclude ? [...selection.exclude] : undefined,
      range: selection.range ? { ...selection.range } : undefined,
    };
    const hasInclude = (next.include?.length ?? 0) > 0;
    const hasExclude = (next.exclude?.length ?? 0) > 0;
    const hasRange = next.range?.min != null || next.range?.max != null;
    if (hasInclude || hasExclude || hasRange) {
      facets[fieldId] = next;
    }
  }
  return { version: state.version, facets };
}

/**
 * Client-side faceted filter engine.
 * Builds inverted bitsets per facet value and ANDs active groups with include/exclude and OR/AND.
 */
export class FilterEngine {
  readonly count: number;
  readonly definitions: readonly FacetDefinition[];
  readonly game: GameDefinition;

  private readonly ids: Uint32Array;
  private readonly rowById: Map<number, number>;
  private readonly all: Uint32Array;
  private readonly baseMask: Uint32Array;
  private readonly shownMask: Uint32Array;
  private readonly scratch: Uint32Array;
  private readonly fields: IndexedField[];
  private readonly cardsByRow: YugiohCard[];
  private readonly formatBanFields = new Map<string, IndexedField>();

  constructor(cards: readonly YugiohCard[], game: GameDefinition = resolveGame(undefined)) {
    this.game = game;
    const definitions = game.facetDefinitions;
    this.definitions = definitions;

    const ordered = cards
      .map((card) => game.prepareCard(card))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
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
    for (const indexer of game.fieldIndexers) tables.set(indexer.id, new Map());

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
      for (const indexer of game.fieldIndexers) {
        if (!defById.has(indexer.id)) continue;
        for (const value of indexer.valuesForRow(card)) add(indexer.id, value, row);
      }
    }

    this.fields = game.fieldIndexers
      .filter((indexer) => defById.has(indexer.id))
      .map((indexer) => {
        const table = tables.get(indexer.id) ?? new Map<string, Uint32Array>();
        const values = [...table.keys()].sort((a, b) =>
          indexer.compareValues ? indexer.compareValues(a, b) : a.localeCompare(b),
        );
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
    const normalized = this.contextualState(state, options.formatParam);
    this.computeMask(normalized, this.shownMask, undefined, options);
    const ids: number[] = [];
    forEachSetBit(this.shownMask, this.count, (row) => {
      ids.push(this.ids[row]);
    });
    return { count: ids.length, ids };
  }

  /**
   * Live option counts. Each group ignores its own selections; options OR within a group.
   */
  recount(state: FilterState, options: FilterApplyOptions = {}): FacetGroupCounts[] {
    const normalized = this.contextualState(state, options.formatParam);
    this.fillBaseMask(options);
    const activeFields = this.fieldsForApply(options.formatParam);
    const out: FacetGroupCounts[] = [];
    for (const field of activeFields) {
      const optionsForField: FacetOptionCount[] = [];
      for (let i = 0; i < field.bitsets.length; i++) {
        const value = field.values[i];
        this.computeMask(normalized, this.scratch, field.id, options);
        const count = andPopcount(this.scratch, field.bitsets[i]);
        optionsForField.push({ value, count });
      }
      out.push({ fieldId: field.id, options: optionsForField });
    }
    return out;
  }

  /** Facet fields that have catalog options or custom range inputs in the UI. */
  fieldsWithCatalog(): readonly FacetFieldId[] {
    const ids = this.fields.filter((field) => field.values.length > 0).map((field) => field.id);
    const declared = new Set(this.definitions.map((definition) => definition.id));
    for (const id of this.game.rangeFieldIds) {
      if (declared.has(id) && !ids.includes(id)) ids.push(id);
    }
    if (declared.has('banStatus') && !ids.includes('banStatus')) ids.unshift('banStatus');
    return ids;
  }

  optionCount(groups: readonly FacetGroupCounts[], fieldId: FacetFieldId, value: string): number {
    for (const group of groups) {
      if (group.fieldId !== fieldId) continue;
      const match = group.options.find((opt) => opt.value === value);
      return match?.count ?? 0;
    }
    return 0;
  }

  private fillBaseMask(options: FilterApplyOptions): void {
    const poolCatalogIds = options.poolCatalogIds;
    if (poolCatalogIds !== undefined) {
      this.baseMask.fill(0);
      for (const id of poolCatalogIds) {
        const row = this.rowById.get(id);
        if (row !== undefined) setBit(this.baseMask, row);
      }
      return;
    }

    this.baseMask.set(this.all);
    const searchIds = options.searchIds;
    if (!searchIds) return;
    this.baseMask.fill(0);
    for (const id of searchIds) {
      const row = this.rowById.get(id);
      if (row !== undefined) setBit(this.baseMask, row);
    }
  }

  private fieldsForApply(formatParam: string | null | undefined): IndexedField[] {
    const banField = this.formatBanField(formatParam);
    if (!banField) return this.fields;
    return [banField, ...this.fields];
  }

  private contextualState(state: FilterState, formatParam: string | null | undefined): FilterState {
    return filterStateForFormatContext(
      normalizeFilterState(state),
      formatParam,
      this.game.isKnownFormatId,
    );
  }

  private formatBanField(formatParam: string | null | undefined): IndexedField | null {
    if (!formatParam || !this.game.isKnownFormatId(formatParam)) return null;
    const key = formatParam.trim().toLowerCase();
    const cached = this.formatBanFields.get(key);
    if (cached) return cached;

    const defById = new Map(this.definitions.map((def) => [def.id, def]));
    const definition = defById.get('banStatus');
    if (!definition) return null;

    const words = wordCount(this.count);
    const table = new Map<string, Uint32Array>();
    const add = (value: string, row: number) => {
      let bits = table.get(value);
      if (!bits) {
        bits = new Uint32Array(words);
        table.set(value, bits);
      }
      setBit(bits, row);
    };

    for (let row = 0; row < this.count; row++) {
      add(this.game.banStatusValue(this.cardsByRow[row], key), row);
    }

    const values = [...table.keys()].sort((a, b) => a.localeCompare(b));
    const field: IndexedField = {
      id: 'banStatus',
      definition,
      values,
      bitsets: values.map((value) => table.get(value) ?? new Uint32Array(words)),
      valueIndex: new Map(values.map((value, index) => [value, index])),
      unionScratch: new Uint32Array(words),
      unionOn: false,
      excludeUnionScratch: new Uint32Array(words),
      excludeOn: false,
    };
    this.formatBanFields.set(key, field);
    return field;
  }

  private computeMask(
    state: FilterState,
    target: Uint32Array,
    skipFieldId?: FacetFieldId,
    options: FilterApplyOptions = {},
  ): void {
    this.fillBaseMask(options);
    this.prepareUnions(state, options.formatParam);
    target.set(this.baseMask);
    for (const field of this.fieldsForApply(options.formatParam)) {
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

  private prepareUnions(state: FilterState, formatParam?: string | null): void {
    for (const field of this.fields) {
      field.unionOn = false;
      field.excludeOn = false;
    }
    for (const field of this.formatBanFields.values()) {
      field.unionOn = false;
      field.excludeOn = false;
    }

    for (const field of this.fieldsForApply(formatParam)) {
      const selection = state.facets[field.id];
      if (!selection) continue;

      if (this.game.skipBitsetUnionFieldIds.includes(field.id)) {
        continue;
      }

      const frameFieldId = this.game.frameKeyword?.fieldId;
      if (selection.include && selection.include.length > 0) {
        let started = false;
        for (const value of selection.include) {
          if (field.id === frameFieldId) {
            started = this.orFrameKeyword(field, value, started);
            continue;
          }
          const index = field.valueIndex.get(value);
          if (index === undefined) continue;
          const bits = field.bitsets[index];
          if (!started) {
            field.unionScratch.set(bits);
            started = true;
          } else {
            orInPlace(field.unionScratch, bits);
          }
        }
        field.unionOn = started;
      }

      if (selection.exclude && selection.exclude.length > 0) {
        let started = false;
        for (const value of selection.exclude) {
          if (field.id === frameFieldId) {
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

  private rowHasFrameKeyword(card: YugiohCard, keyword: string): boolean {
    return this.game.frameKeyword?.rowHas(card, keyword) ?? false;
  }

  private orFrameKeyword(field: IndexedField, keyword: string, started: boolean): boolean {
    const scratch = this.scratch;
    scratch.fill(0);
    for (let row = 0; row < this.count; row++) {
      if (this.rowHasFrameKeyword(this.cardsByRow[row], keyword)) setBit(scratch, row);
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
      if (this.rowHasFrameKeyword(this.cardsByRow[row], keyword)) setBit(scratch, row);
    }
    if (!started) target.set(scratch);
    else orInPlace(target, scratch);
  }

  /** Range tokens and level bucket includes that are not single inverted bitsets. */
  private applyDynamicPredicates(
    state: FilterState,
    mask: Uint32Array,
    skipFieldId?: FacetFieldId,
  ): void {
    for (const fieldId of this.game.rangeFieldIds) {
      if (skipFieldId === fieldId) continue;
      const range = state.facets[fieldId]?.range;
      if (!range || (range.min == null && range.max == null)) continue;
      forEachSetBit(mask, this.count, (row) => {
        if (!this.game.rowMatchesRange(this.cardsByRow[row], fieldId, range)) {
          this.clearRow(mask, row);
        }
      });
    }

    const levelTokens = this.game.levelTokens;
    if (levelTokens && skipFieldId !== levelTokens.fieldId) {
      const levelSel = state.facets[levelTokens.fieldId]?.include;
      if (levelSel && levelSel.length > 0) {
        forEachSetBit(mask, this.count, (row) => {
          if (!levelTokens.rowMatches(this.cardsByRow[row], levelSel)) this.clearRow(mask, row);
        });
      }
    }
  }

  private clearRow(mask: Uint32Array, row: number): void {
    const word = row >>> 5;
    mask[word] = (mask[word] & ~(1 << (row & 31))) >>> 0;
  }
}

export function buildFilterEngine(
  cards: readonly YugiohCard[],
  game: GameDefinition = resolveGame(undefined),
): FilterEngine {
  return new FilterEngine(cards, game);
}
