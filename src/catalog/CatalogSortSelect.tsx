import { SortSelect } from '../ui/SortSelect.tsx';
import { CATALOG_TABLE_SORTABLE_COLUMN_DEFS } from './catalogTableColumns.ts';
import type { CatalogTableSortColumnId } from './catalogTableColumns.ts';
import type { CatalogTableSortState } from './catalogTableSort.ts';

const SORT_OPTIONS = CATALOG_TABLE_SORTABLE_COLUMN_DEFS.map((column) => ({
  value: column.id,
  label: column.label,
}));

export function CatalogSortSelect({
  sort,
  onChange,
}: {
  sort: CatalogTableSortState;
  onChange: (next: CatalogTableSortState) => void;
}) {
  return (
    <SortSelect<CatalogTableSortColumnId>
      value={sort.column}
      options={SORT_OPTIONS}
      onChange={(column) => onChange({ column, direction: sort.direction })}
      direction={sort.direction}
      onDirectionChange={(direction) => onChange({ column: sort.column, direction })}
    />
  );
}
