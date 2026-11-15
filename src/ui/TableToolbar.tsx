import type { ReactNode } from 'react';

import { Menu } from './Menu.tsx';
import { toolbarButtonClass } from './classes.ts';
import {
  defaultTableColumnVisibility,
  isTableColumnVisible,
  type TableColumn,
  type TableColumnVisibility,
} from './tableColumns.ts';

function toggleTableColumn(
  columns: readonly TableColumn[],
  visibility: Readonly<Partial<TableColumnVisibility>>,
  id: string,
): TableColumnVisibility {
  const next = defaultTableColumnVisibility(columns);
  for (const column of columns) {
    if (column.locked) continue;
    next[column.id] = isTableColumnVisible(column, visibility);
  }
  const column = columns.find((entry) => entry.id === id);
  if (!column || column.locked) return next;
  next[id] = !isTableColumnVisible(column, visibility);
  return next;
}

function ColumnPicker({
  label,
  columns,
  visibility,
  onVisibilityChange,
}: {
  label: string;
  columns: readonly TableColumn[];
  visibility: Readonly<Partial<TableColumnVisibility>>;
  onVisibilityChange: (next: TableColumnVisibility) => void;
}) {
  const optional = columns.filter((column) => !column.locked);
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
          className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-text hover:bg-surface-2"
        >
          <input
            type="checkbox"
            className="size-4 shrink-0 accent-[var(--color-accent)]"
            checked={isTableColumnVisible(column, visibility)}
            onChange={() => onVisibilityChange(toggleTableColumn(columns, visibility, column.id))}
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
  label = 'Table columns',
  variant = 'bar',
  children,
  actions,
  className,
}: {
  columns: readonly TableColumn[];
  visibility: Readonly<Partial<TableColumnVisibility>>;
  onVisibilityChange: (next: TableColumnVisibility) => void;
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
