import { buildSearchIndex, type SearchIndex } from '../search/index.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { buildFilterEngine, emptyFilterState, type FilterEngine } from './filterEngine.ts';

export type CatalogDerived = {
  readonly cards: readonly YugiohCard[];
  readonly cardById: ReadonlyMap<number, YugiohCard>;
  /** Maps alternate artwork passcodes to the catalog card id that owns them. */
  readonly cardIdByArtId: ReadonlyMap<number, number>;
  readonly filterEngine: FilterEngine;
  readonly searchIndex: SearchIndex;
  /** Name order for the full catalog (matches FilterEngine row order). */
  readonly allIdsByName: readonly number[];
};

const derivedByCatalog = new WeakMap<readonly YugiohCard[], CatalogDerived>();

export function getCatalogDerived(cards: readonly YugiohCard[]): CatalogDerived {
  const existing = derivedByCatalog.get(cards);
  if (existing) return existing;

  const filterEngine = buildFilterEngine(cards);
  const searchIndex = buildSearchIndex(cards);
  const cardById = new Map<number, YugiohCard>();
  const cardIdByArtId = new Map<number, number>();
  for (const card of cards) {
    cardById.set(card.id, card);
    cardIdByArtId.set(card.id, card.id);
    for (const artId of card.artIds ?? []) {
      if (Number.isFinite(artId)) {
        cardIdByArtId.set(artId, card.id);
      }
    }
  }
  const allIdsByName = filterEngine.apply(emptyFilterState()).ids;

  const derived: CatalogDerived = {
    cards,
    cardById,
    cardIdByArtId,
    filterEngine,
    searchIndex,
    allIdsByName,
  };
  derivedByCatalog.set(cards, derived);
  return derived;
}

/** Test-only: drop cached indexes for a catalog array. */
export function forgetCatalogDerived(cards: readonly YugiohCard[]): void {
  derivedByCatalog.delete(cards);
}
