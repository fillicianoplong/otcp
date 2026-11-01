import type { YugiohCard } from '../shared/schema/card.ts';
import { formatStorePrice } from '../prices/formatPrice.ts';

export type CatalogTableSortColumnId =
  | 'name'
  | 'cardType'
  | 'attribute'
  | 'type'
  | 'level'
  | 'atk'
  | 'def'
  | 'archetype'
  | 'price'
  | 'ban';

export type CatalogTableColumnDefinition = {
  id: CatalogTableSortColumnId;
  label: string;
};

export type CatalogTableOptionalColumnDefinition = {
  id: CatalogTableOptionalColumnId;
  label: string;
  defaultVisible: boolean;
};

export type CatalogTableOptionalColumnId = Exclude<CatalogTableSortColumnId, 'name' | 'ban'>;

export const CATALOG_TABLE_NAME_COLUMN: CatalogTableColumnDefinition = {
  id: 'name',
  label: 'Name',
};

export const CATALOG_TABLE_OPTIONAL_COLUMN_DEFS: CatalogTableOptionalColumnDefinition[] = [
  { id: 'cardType', label: 'Card type', defaultVisible: true },
  { id: 'attribute', label: 'Attribute', defaultVisible: true },
  { id: 'type', label: 'Type', defaultVisible: true },
  { id: 'level', label: 'Level', defaultVisible: true },
  { id: 'atk', label: 'ATK', defaultVisible: true },
  { id: 'def', label: 'DEF', defaultVisible: true },
  { id: 'archetype', label: 'Archetype', defaultVisible: false },
  { id: 'price', label: 'Price', defaultVisible: false },
];

export const CATALOG_TABLE_BAN_COLUMN: CatalogTableColumnDefinition = {
  id: 'ban',
  label: 'Ban',
};

export const CATALOG_TABLE_OPTIONAL_COLUMN_IDS = CATALOG_TABLE_OPTIONAL_COLUMN_DEFS.map(
  (column) => column.id,
);

export type CatalogTableColumnVisibility = Record<CatalogTableOptionalColumnId, boolean>;

export const DEFAULT_CATALOG_TABLE_COLUMN_VISIBILITY: CatalogTableColumnVisibility =
  Object.fromEntries(
    CATALOG_TABLE_OPTIONAL_COLUMN_DEFS.map((column) => [column.id, column.defaultVisible]),
  ) as CatalogTableColumnVisibility;

export const CATALOG_TABLE_SORTABLE_COLUMN_DEFS: CatalogTableColumnDefinition[] = [
  CATALOG_TABLE_NAME_COLUMN,
  ...CATALOG_TABLE_OPTIONAL_COLUMN_DEFS,
  CATALOG_TABLE_BAN_COLUMN,
];

const columnLabelById = new Map<CatalogTableSortColumnId, string>(
  CATALOG_TABLE_SORTABLE_COLUMN_DEFS.map((column) => [column.id, column.label]),
);

export function catalogTableColumnLabel(columnId: CatalogTableSortColumnId): string {
  const label = columnLabelById.get(columnId);
  if (!label) {
    throw new Error(`Unknown catalog table column: ${columnId}`);
  }
  return label;
}

function formatStat(value: number | undefined): string {
  if (value === undefined || value < 0) return '—';
  return String(value);
}

function isSpellOrTrap(card: YugiohCard): boolean {
  return card.type.includes('Spell') || card.type.includes('Trap');
}

/** Frame / category line from the dataset (e.g. Effect Monster, Quick-Play Spell Card). */
export function catalogTableCardTypeCell(card: YugiohCard): string {
  return card.type.trim().length > 0 ? card.type : '—';
}

export function catalogTableAttributeCell(card: YugiohCard): string {
  if (isSpellOrTrap(card)) return '—';
  return card.attribute ?? '—';
}

/** Monster race or Spell/Trap property (single token). */
export function catalogTableRaceOrPropertyCell(card: YugiohCard): string {
  if (card.type.startsWith('Quick-Play')) return 'Quick-Play';
  if (isSpellOrTrap(card)) {
    const property = card.race?.trim();
    return property && property.length > 0 ? property : '—';
  }
  const race = card.race?.trim();
  return race && race.length > 0 ? race : '—';
}

export function catalogTableLevelSortValue(card: YugiohCard): number | undefined {
  if (isSpellOrTrap(card)) return undefined;
  if (card.linkRating != null) return card.linkRating;
  if (card.rank != null) return card.rank;
  if (card.level != null) return card.level;
  return undefined;
}

export function catalogTableLevelCell(card: YugiohCard): string {
  const value = catalogTableLevelSortValue(card);
  return value === undefined ? '—' : String(value);
}

export function catalogTableAtkCell(card: YugiohCard): string {
  if (isSpellOrTrap(card)) return '—';
  return formatStat(card.atk);
}

export function catalogTableDefCell(card: YugiohCard): string {
  if (isSpellOrTrap(card)) return '—';
  if (card.linkRating != null) return '—';
  return formatStat(card.def);
}

export function catalogTableArchetypeCell(card: YugiohCard): string {
  const value = card.archetype?.trim();
  return value && value.length > 0 ? value : '—';
}

export function catalogTablePriceCell(card: YugiohCard): string {
  return formatStorePrice(card.prices?.tcgplayer, 'USD');
}

export function catalogTablePriceSortValue(card: YugiohCard): number | undefined {
  const value = card.prices?.tcgplayer;
  if (value === undefined || value <= 0) return undefined;
  return value;
}
