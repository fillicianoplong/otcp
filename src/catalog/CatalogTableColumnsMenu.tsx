import {
  CATALOG_TABLE_OPTIONAL_COLUMN_DEFS,
  type CatalogTableColumnVisibility,
  type CatalogTableOptionalColumnId,
} from './catalogTableColumns.ts';
import { Menu } from '../ui/Menu.tsx';
import { toolbarButtonClass } from '../ui/classes.ts';

export function CatalogTableColumnsMenu({
  visibility,
  onChange,
}: {
  visibility: CatalogTableColumnVisibility;
  onChange: (next: CatalogTableColumnVisibility) => void;
}) {
  const toggleColumn = (columnId: CatalogTableOptionalColumnId) => {
    onChange({ ...visibility, [columnId]: !visibility[columnId] });
  };

  return (
    <Menu
      label="Table columns"
      trigger={
        <>
          Columns
          <span aria-hidden className="text-text-2">
            ▾
          </span>
        </>
      }
      triggerClassName={toolbarButtonClass}
    >
      {CATALOG_TABLE_OPTIONAL_COLUMN_DEFS.map((column) => (
        <label
          key={column.id}
          role="menuitemcheckbox"
          aria-checked={visibility[column.id]}
          aria-label={column.label}
          className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-text hover:bg-surface-2"
        >
          <input
            type="checkbox"
            className="size-4 shrink-0 accent-[var(--color-accent)]"
            checked={visibility[column.id]}
            onChange={() => toggleColumn(column.id)}
          />
          {column.label}
        </label>
      ))}
    </Menu>
  );
}
