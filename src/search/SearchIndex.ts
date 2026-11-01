import type { YugiohCard } from '../shared/schema/card.ts';
import { andInPlace, forEachSetBit, orInPlace, setBit, wordCount } from './bitset.ts';
import { normalizeSearchText } from './normalize.ts';
import { tokenize, trigramsOf } from './text.ts';

export type SearchQueryResult = {
  count: number;
  ids: number[];
};

/** Lower rank sorts earlier in results. */
const enum MatchRank {
  PasscodeExact = 0,
  NameExact = 1,
  NamePrefix = 2,
  NameSubstring = 3,
  TextToken = 4,
  PasscodePrefix = 5,
}

type IndexedCard = {
  id: number;
  sortName: string;
  normalizedName: string;
  idText: string;
  idPadded: string;
};

/**
 * In-memory name and passcode index (ADR-009).
 * Name search uses character trigrams with a linear scan below 3 characters.
 * Rules-text tokens union with name matches (FR-02).
 */
export class SearchIndex {
  readonly count: number;

  private readonly ids: Uint32Array;
  private readonly cards: IndexedCard[];
  private readonly queryMask: Uint32Array;
  private readonly candMask: Uint32Array;
  private readonly trigrams: Map<string, Uint32Array>;
  private readonly tokens: Map<string, Uint32Array>;

  constructor(cards: readonly YugiohCard[]) {
    const ordered = cards.slice().sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
    const count = ordered.length;
    const words = wordCount(count);
    this.count = count;
    this.ids = new Uint32Array(count);
    this.cards = new Array<IndexedCard>(count);
    this.queryMask = new Uint32Array(words);
    this.candMask = new Uint32Array(words);
    this.trigrams = new Map();
    this.tokens = new Map();

    for (let row = 0; row < count; row++) {
      const card = ordered[row];
      this.ids[row] = card.id;
      const normalizedName = normalizeSearchText(card.name);
      const passcode = card.passcode ?? card.id;
      const rawId = String(passcode);
      this.cards[row] = {
        id: card.id,
        sortName: card.name,
        normalizedName,
        idText: rawId,
        idPadded: rawId.length >= 8 ? rawId : rawId.padStart(8, '0'),
      };

      const padded = ` ${normalizedName} `;
      for (const gram of trigramsOf(padded)) {
        let bits = this.trigrams.get(gram);
        if (!bits) {
          bits = new Uint32Array(words);
          this.trigrams.set(gram, bits);
        }
        setBit(bits, row);
      }

      for (const token of tokenize(card.text)) {
        let bits = this.tokens.get(token);
        if (!bits) {
          bits = new Uint32Array(words);
          this.tokens.set(token, bits);
        }
        setBit(bits, row);
      }
    }
  }

  /** Typed name substring, rules-text tokens, and passcode lookup with sensible ranking. */
  query(raw: string): SearchQueryResult {
    const trimmed = raw.trim();
    if (!trimmed) {
      const ids = Array.from(this.ids);
      return { count: ids.length, ids };
    }

    const query = normalizeSearchText(trimmed);
    this.queryMask.fill(0);
    this.addNameMatches(query);
    this.addTextMatches(query);
    this.addPasscodeMatches(trimmed);

    const ranked: { row: number; rank: MatchRank }[] = [];
    forEachSetBit(this.queryMask, this.count, (row) => {
      ranked.push({ row, rank: this.rankRow(row, query, trimmed) });
    });

    ranked.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return this.cards[a.row].sortName.localeCompare(this.cards[b.row].sortName);
    });

    const ids = ranked.map(({ row }) => this.ids[row]);
    return { count: ids.length, ids };
  }

  private rankRow(row: number, normalizedQuery: string, rawQuery: string): MatchRank {
    const card = this.cards[row];
    if (/^\d+$/.test(rawQuery)) {
      if (card.idText === rawQuery || card.idPadded === rawQuery) return MatchRank.PasscodeExact;
      if (card.idText.startsWith(rawQuery) || card.idPadded.startsWith(rawQuery)) {
        return MatchRank.PasscodePrefix;
      }
    }

    const name = card.normalizedName;
    if (name === normalizedQuery) return MatchRank.NameExact;
    if (name.startsWith(normalizedQuery)) return MatchRank.NamePrefix;
    if (name.includes(normalizedQuery)) return MatchRank.NameSubstring;
    return MatchRank.TextToken;
  }

  private addNameMatches(query: string): void {
    if (query.length < 3) {
      const names = this.cards;
      for (let i = 0; i < names.length; i++) {
        if (names[i].normalizedName.includes(query)) setBit(this.queryMask, i);
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
    const names = this.cards;
    const mask = this.queryMask;
    forEachSetBit(cand, this.count, (row) => {
      if (names[row].normalizedName.includes(query)) setBit(mask, row);
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
    const mask = this.queryMask;
    const rows = this.cards;
    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i].idText;
      const padded = rows[i].idPadded;
      if (raw.startsWith(query) || (padded !== raw && padded.startsWith(query))) setBit(mask, i);
    }
  }
}

/** Build an index once the card catalog is ready. */
export function buildSearchIndex(cards: readonly YugiohCard[]): SearchIndex {
  return new SearchIndex(cards);
}

/** Exposed for latency benchmarks (search pass only, no UI). */
export function measureSearchPass(index: SearchIndex, query: string): number {
  const start = performance.now();
  index.query(query);
  return performance.now() - start;
}
