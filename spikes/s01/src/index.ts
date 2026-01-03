import {
  andInPlace,
  andPopcount,
  filledMask,
  forEachSetBit,
  orInPlace,
  popcount,
  setBit,
  wordCount,
} from './bitset.ts';
import { tokenize, trigramsOf } from './text.ts';
import { FACET_GROUPS, type FacetGroupId, type FacetSelection, type TrimmedCard } from './types.ts';

export type GroupView = {
  id: FacetGroupId;
  values: readonly string[];
  counts: Float64Array;
};

type GroupState = GroupView & {
  bitsets: Uint32Array[];
  valueIndex: Map<string, number>;
  unionScratch: Uint32Array;
  unionOn: boolean;
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

function levelValue(card: TrimmedCard): string | null {
  if (typeof card.linkval === 'number') return `L${card.linkval}`;
  if (typeof card.level === 'number') return String(card.level);
  return null;
}

/**
 * In-memory name, passcode, and facet index.
 * Name search uses character trigrams (a linear scan below 3 characters).
 * Facet counts use inverted bitsets. Counts for a group ignore that group's
 * own selection so each option shows how many cards it would add.
 * Hot-path buffers are reused. Returned views are valid until the next call.
 */
export class SearchIndex {
  readonly count: number;
  readonly bitsetBytes: number;
  readonly trigramCount: number;
  readonly tokenCount: number;
  readonly facetSizes: Record<FacetGroupId, number>;

  private readonly ids: Uint32Array;
  private readonly lowerNames: string[];
  private readonly idText: string[];
  private readonly idPadded: string[];
  private readonly rowById: Map<number, number>;
  private readonly all: Uint32Array;
  private readonly queryMask: Uint32Array;
  private readonly shownMask: Uint32Array;
  private readonly candMask: Uint32Array;
  private readonly baseScratch: Uint32Array;
  private readonly trigrams: Map<string, Uint32Array>;
  private readonly tokens: Map<string, Uint32Array>;
  private readonly groupList: GroupState[];
  private readonly viewScratch: GroupState[] = [];

  constructor(cards: readonly TrimmedCard[]) {
    const ordered = cards.slice().sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
    const count = ordered.length;
    const words = wordCount(count);
    this.count = count;
    this.ids = new Uint32Array(count);
    this.lowerNames = new Array<string>(count);
    this.idText = new Array<string>(count);
    this.idPadded = new Array<string>(count);
    this.rowById = new Map();
    this.all = filledMask(count, words);
    this.queryMask = new Uint32Array(words);
    this.shownMask = new Uint32Array(words);
    this.candMask = new Uint32Array(words);
    this.baseScratch = new Uint32Array(words);
    this.trigrams = new Map();
    this.tokens = new Map();

    const mutable = new Map<FacetGroupId, Map<string, Uint32Array>>();
    for (const group of FACET_GROUPS) mutable.set(group, new Map());

    const add = (group: FacetGroupId, value: string, row: number) => {
      const table = mutable.get(group);
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
      const lower = card.name.toLowerCase();
      this.lowerNames[row] = lower;
      const rawId = String(card.id);
      this.idText[row] = rawId;
      this.idPadded[row] = rawId.length >= 8 ? rawId : rawId.padStart(8, '0');

      const padded = ` ${lower} `;
      for (const gram of trigramsOf(padded)) {
        let bits = this.trigrams.get(gram);
        if (!bits) {
          bits = new Uint32Array(words);
          this.trigrams.set(gram, bits);
        }
        setBit(bits, row);
      }

      for (const token of tokenize(card.desc)) {
        let bits = this.tokens.get(token);
        if (!bits) {
          bits = new Uint32Array(words);
          this.tokens.set(token, bits);
        }
        setBit(bits, row);
      }

      if (card.type) add('type', card.type, row);
      if (card.attribute) add('attribute', card.attribute, row);
      if (card.race) add('race', card.race, row);
      const level = levelValue(card);
      if (level) add('level', level, row);
      if (typeof card.atk === 'number') add('atk', statBucket(card.atk), row);
      if (typeof card.def === 'number') add('def', statBucket(card.def), row);
      if (card.archetype) add('archetype', card.archetype, row);
      add('banlist', card.banTcg ?? 'Unlimited', row);
    }

    this.groupList = FACET_GROUPS.map((id) => {
      const table = mutable.get(id) ?? new Map<string, Uint32Array>();
      const values = [...table.keys()].sort();
      return {
        id,
        values,
        counts: new Float64Array(values.length),
        bitsets: values.map((value) => table.get(value) ?? new Uint32Array(words)),
        valueIndex: new Map(values.map((value, index) => [value, index])),
        unionScratch: new Uint32Array(words),
        unionOn: false,
      };
    });

    this.trigramCount = this.trigrams.size;
    this.tokenCount = this.tokens.size;
    this.facetSizes = {
      type: 0,
      attribute: 0,
      race: 0,
      level: 0,
      atk: 0,
      def: 0,
      archetype: 0,
      banlist: 0,
    };
    let bytes = this.all.byteLength;
    for (const bits of this.trigrams.values()) bytes += bits.byteLength;
    for (const bits of this.tokens.values()) bytes += bits.byteLength;
    for (const group of this.groupList) {
      this.facetSizes[group.id] = group.values.length;
      for (const bits of group.bitsets) bytes += bits.byteLength;
    }
    this.bitsetBytes = bytes;
  }

  /** Name substring, rules-text tokens, and numeric passcode prefix, unioned. */
  search(raw: string): void {
    const query = raw.trim().toLowerCase();
    if (!query) {
      this.queryMask.set(this.all);
      return;
    }
    this.queryMask.fill(0);
    this.addNameMatches(query);
    this.addTextMatches(query);
    this.addPasscodeMatches(query);
  }

  hasId(id: number): boolean {
    const row = this.rowById.get(id);
    if (row === undefined) return false;
    return (this.queryMask[row >>> 5] & (1 << (row & 31))) !== 0;
  }

  /** Ids in name order, up to `limit`. Uses the current query and selection. */
  collectShown(selected: FacetSelection, limit: number): number[] {
    this.fillShown(selected);
    const out: number[] = [];
    const ids = this.ids;
    forEachSetBit(this.shownMask, this.count, (row) => {
      out.push(ids[row]);
      return out.length < limit;
    });
    return out;
  }

  constrainCount(selected: FacetSelection): number {
    this.fillShown(selected);
    return popcount(this.shownMask);
  }

  /**
   * Per-option counts for the current query. A group's counts ignore that
   * group's selection and keep every other selection.
   */
  recount(selected: FacetSelection, only?: readonly FacetGroupId[]): GroupView[] {
    this.prepareUnions(selected);
    const out = this.viewScratch;
    out.length = 0;
    for (const group of this.groupList) {
      if (only && !only.includes(group.id)) continue;
      const base = this.baseScratch;
      base.set(this.queryMask);
      for (const other of this.groupList) {
        if (other === group || !other.unionOn) continue;
        andInPlace(base, other.unionScratch);
      }
      const counts = group.counts;
      const bitsets = group.bitsets;
      for (let i = 0; i < bitsets.length; i++) counts[i] = andPopcount(base, bitsets[i]);
      out.push(group);
    }
    return out;
  }

  packBitsets(): Uint8Array {
    const parts: Uint32Array[] = [this.all];
    for (const bits of this.trigrams.values()) parts.push(bits);
    for (const bits of this.tokens.values()) parts.push(bits);
    for (const group of this.groupList) {
      for (const bits of group.bitsets) parts.push(bits);
    }
    let bytes = 0;
    for (const bits of parts) bytes += bits.byteLength;
    const packed = new Uint8Array(bytes);
    let offset = 0;
    for (const bits of parts) {
      const view = new Uint8Array(bits.buffer, bits.byteOffset, bits.byteLength);
      packed.set(view, offset);
      offset += bits.byteLength;
    }
    return packed;
  }

  private fillShown(selected: FacetSelection): void {
    this.prepareUnions(selected);
    this.shownMask.set(this.queryMask);
    for (const group of this.groupList) {
      if (group.unionOn) andInPlace(this.shownMask, group.unionScratch);
    }
  }

  private prepareUnions(selected: FacetSelection): void {
    for (const group of this.groupList) {
      const values = selected[group.id];
      group.unionOn = false;
      if (!values || values.length === 0) continue;
      let started = false;
      for (const value of values) {
        const index = group.valueIndex.get(value);
        if (index === undefined) continue;
        const bits = group.bitsets[index];
        if (!started) {
          group.unionScratch.set(bits);
          started = true;
        } else {
          orInPlace(group.unionScratch, bits);
        }
      }
      group.unionOn = started;
    }
  }

  private addNameMatches(query: string): void {
    if (query.length < 3) {
      const names = this.lowerNames;
      for (let i = 0; i < names.length; i++) {
        if (names[i].includes(query)) setBit(this.queryMask, i);
      }
      return;
    }
    const grams = trigramsOf(query);
    const first = this.trigrams.get(grams[0]);
    if (!first) return;
    const cand = this.candMask;
    cand.set(first);
    for (let i = 1; i < grams.length; i++) {
      const bits = this.trigrams.get(grams[i]);
      if (!bits) return;
      andInPlace(cand, bits);
    }
    const names = this.lowerNames;
    const mask = this.queryMask;
    forEachSetBit(cand, this.count, (row) => {
      if (names[row].includes(query)) setBit(mask, row);
    });
  }

  private addTextMatches(query: string): void {
    const tokens = tokenize(query);
    if (tokens.length === 0) return;
    const first = this.tokens.get(tokens[0]);
    if (!first) return;
    const cand = this.candMask;
    cand.set(first);
    for (let i = 1; i < tokens.length; i++) {
      const bits = this.tokens.get(tokens[i]);
      if (!bits) return;
      andInPlace(cand, bits);
    }
    orInPlace(this.queryMask, cand);
  }

  private addPasscodeMatches(query: string): void {
    if (!/^\d+$/.test(query)) return;
    const rawIds = this.idText;
    const padded = this.idPadded;
    const mask = this.queryMask;
    for (let i = 0; i < rawIds.length; i++) {
      const raw = rawIds[i];
      if (raw.startsWith(query) || (padded[i] !== raw && padded[i].startsWith(query)))
        setBit(mask, i);
    }
  }
}

export function optionCount(
  views: readonly GroupView[],
  group: FacetGroupId,
  value: string,
): number {
  for (const view of views) {
    if (view.id !== group) continue;
    const index = view.values.indexOf(value);
    return index < 0 ? 0 : view.counts[index];
  }
  return 0;
}
