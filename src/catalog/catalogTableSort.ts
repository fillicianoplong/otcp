import type { YugiohCard } from '../shared/schema/card.ts';
import { resolveCardBanForFormat } from './formatBanContext.ts';
import type { BanDisplayStatus } from './formatBanContext.ts';
import {
  catalogTableArchetypeCell,
  catalogTableCardTypeCell,
  catalogTableLevelSortValue,
  catalogTablePriceSortValue,
  catalogTableRaceOrPropertyCell,
  type CatalogTableSortColumnId,
} from './catalogTableColumns.ts';

export type CatalogTableSortDirection = 'asc' | 'desc';

export type CatalogTableSortState = {
  column: CatalogTableSortColumnId;
  direction: CatalogTableSortDirection;
};

export const DEFAULT_CATALOG_TABLE_SORT: CatalogTableSortState = {
  column: 'name',
  direction: 'asc',
};

const BAN_SORT_RANK: Record<BanDisplayStatus, number> = {
  Forbidden: 3,
  Limited: 2,
  'Semi-Limited': 1,
};

function directionMultiplier(direction: CatalogTableSortDirection): 1 | -1 {
  return direction === 'asc' ? 1 : -1;
}

/** Missing / empty values sort after present values for both directions. */
function comparePresent(aPresent: boolean, bPresent: boolean, compareValues: () => number): number {
  if (!aPresent && !bPresent) return 0;
  if (!aPresent) return 1;
  if (!bPresent) return -1;
  return compareValues();
}

function compareStrings(
  a: string | undefined,
  b: string | undefined,
  direction: CatalogTableSortDirection,
): number {
  const mult = directionMultiplier(direction);
  return comparePresent(
    Boolean(a && a.length > 0 && a !== '—'),
    Boolean(b && b.length > 0 && b !== '—'),
    () => mult * (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' }),
  );
}

function compareNumbers(
  a: number | undefined,
  b: number | undefined,
  direction: CatalogTableSortDirection,
): number {
  const mult = directionMultiplier(direction);
  return comparePresent(a !== undefined, b !== undefined, () => mult * ((a ?? 0) - (b ?? 0)));
}

function isSpellOrTrap(card: YugiohCard): boolean {
  return card.type.includes('Spell') || card.type.includes('Trap');
}

function banSortValue(
  card: YugiohCard,
  formatParam: string | null | undefined,
): number | undefined {
  const status = resolveCardBanForFormat(card, formatParam);
  if (!status) return undefined;
  return BAN_SORT_RANK[status];
}

export function compareCatalogTableRows(
  a: YugiohCard,
  b: YugiohCard,
  sort: CatalogTableSortState,
  formatParam: string | null | undefined,
): number {
  const { column, direction } = sort;

  switch (column) {
    case 'name':
      return compareStrings(a.name, b.name, direction);
    case 'cardType':
      return compareStrings(catalogTableCardTypeCell(a), catalogTableCardTypeCell(b), direction);
    case 'attribute':
      return compareStrings(a.attribute, b.attribute, direction);
    case 'type':
      return compareStrings(
        catalogTableRaceOrPropertyCell(a),
        catalogTableRaceOrPropertyCell(b),
        direction,
      );
    case 'level':
      return compareNumbers(
        catalogTableLevelSortValue(a),
        catalogTableLevelSortValue(b),
        direction,
      );
    case 'atk':
      return compareNumbers(
        isSpellOrTrap(a) ? undefined : a.atk,
        isSpellOrTrap(b) ? undefined : b.atk,
        direction,
      );
    case 'def':
      return compareNumbers(
        isSpellOrTrap(a) || a.linkRating != null ? undefined : a.def,
        isSpellOrTrap(b) || b.linkRating != null ? undefined : b.def,
        direction,
      );
    case 'archetype':
      return compareStrings(catalogTableArchetypeCell(a), catalogTableArchetypeCell(b), direction);
    case 'price':
      return compareNumbers(
        catalogTablePriceSortValue(a),
        catalogTablePriceSortValue(b),
        direction,
      );
    case 'ban':
      return compareNumbers(banSortValue(a, formatParam), banSortValue(b, formatParam), direction);
    default:
      return 0;
  }
}

export function sortCatalogTableRows(
  cards: YugiohCard[],
  sort: CatalogTableSortState,
  formatParam: string | null | undefined,
): YugiohCard[] {
  const copy = cards.slice();
  copy.sort((left, right) => {
    const primary = compareCatalogTableRows(left, right, sort, formatParam);
    if (primary !== 0) return primary;
    return left.id - right.id;
  });
  return copy;
}

export function toggleCatalogTableSort(
  current: CatalogTableSortState,
  column: CatalogTableSortColumnId,
): CatalogTableSortState {
  if (current.column === column) {
    return { column, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { column, direction: 'asc' };
}
