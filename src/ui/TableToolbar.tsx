import type { ReactNode } from 'react';

import { Menu } from './Menu.tsx';
import { menuDenseItemClass, toolbarButtonClass } from './classes.ts';
import {
  isTableColumnVisible,
  normalizeTableColumnOrder,
  setTableColumnVisible,
  type TableColumn,
  type TableColumnVisibility,
} from './tableColumns.ts';

function ColumnPicker({
  label,
  columns,
  visibility,
  order,
  onVisibilityChange,
}: {
  label: string;
  columns: readonly TableColumn[];
  visibility: Readonly<Partial<TableColumnVisibility>>;
  order?: readonly string[] | null;
  onVisibilityChange: (next: TableColumnVisibility) => void;
}) {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const optional = normalizeTableColumnOrder(columns, order)
    .map((id) => byId.get(id))
    .filter((column): column is TableColumn => column != null && !column.locked);
  return (
    <Menu
      label={label}
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
      {optional.map((column) => (
        <label
          key={column.id}
          role="menuitemcheckbox"
          aria-checked={isTableColumnVisible(column, visibility)}
          aria-label={column.label}
          className={menuDenseItemClass}
        >
          <input
            type="checkbox"
            className="size-4 shrink-0 accent-[var(--color-accent)]"
            checked={isTableColumnVisible(column, visibility)}
            onChange={() =>
              onVisibilityChange(
                setTableColumnVisible(
                  columns,
                  visibility,
                  column.id,
                  !isTableColumnVisible(column, visibility),
                ),
              )
            }
          />
          {column.label}
        </label>
      ))}
    </Menu>
  );
}

/**
 * Column picker row used by every table.
 * `inline` is only the Columns control, for a page toolbar that already has its own row.
 */
export function TableToolbar({
  columns,
  visibility,
  onVisibilityChange,
  order,
  label = 'Table columns',
  variant = 'bar',
  children,
  actions,
  className,
}: {
  columns: readonly TableColumn[];
  visibility: Readonly<Partial<TableColumnVisibility>>;
  onVisibilityChange: (next: TableColumnVisibility) => void;
  order?: readonly string[] | null;
  label?: string;
  variant?: 'bar' | 'inline';
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const picker = (
    <ColumnPicker
      label={label}
      columns={columns}
      visibility={visibility}
      order={order}
      onVisibilityChange={onVisibilityChange}
    />
  );

  if (variant === 'inline') return picker;

  return (
    <div className={['flex flex-wrap items-center gap-2', className].filter(Boolean).join(' ')}>
      {children}
      <div className="ml-auto flex items-center gap-2">
        {picker}
        {actions}
      </div>
    </div>
  );
}
