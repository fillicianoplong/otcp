import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { menuDenseItemClass } from './classes.ts';
import { Menu } from './Menu.tsx';
import {
  canMoveTableColumn,
  columnMenuButtonLabel,
  isTableColumnVisible,
  moveTableColumn,
  normalizeTableColumnOrder,
  setTableColumnVisible,
  toggleColumnSort,
  type ColumnSortState,
  type TableColumn,
  type TableColumnVisibility,
} from './tableColumns.ts';

const triggerClassName = [
  'inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-text-2',
  'hover:bg-surface-2 hover:text-heading',
  'focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong',
  'aria-expanded:opacity-100',
  'max-md:opacity-100',
  'md:opacity-0 md:group-hover/col:opacity-100 md:group-focus-within/col:opacity-100',
].join(' ');

function MenuGlyph({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      {children}
    </svg>
  );
}

function KebabIcon() {
  return (
    <MenuGlyph>
      <circle cx="8" cy="3.25" r="0.9" fill="currentColor" />
      <circle cx="8" cy="8" r="0.9" fill="currentColor" />
      <circle cx="8" cy="12.75" r="0.9" fill="currentColor" />
    </MenuGlyph>
  );
}

function ArrowUpIcon() {
  return (
    <MenuGlyph>
      <path
        d="M8 13V3.5M4.5 7 8 3.5 11.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </MenuGlyph>
  );
}

function ArrowDownIcon() {
  return (
    <MenuGlyph>
      <path
        d="M8 3v9.5M4.5 9 8 12.5 11.5 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </MenuGlyph>
  );
}

function ArrowLeftIcon() {
  return (
    <MenuGlyph>
      <path
        d="M13 8H3.5M7 4.5 3.5 8 7 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </MenuGlyph>
  );
}

function ArrowRightIcon() {
  return (
    <MenuGlyph>
      <path
        d="M3 8h9.5M9 4.5 12.5 8 9 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </MenuGlyph>
  );
}

function HideIcon() {
  return (
    <MenuGlyph>
      <path
        d="M2.5 8s2.2-3.5 5.5-3.5S13.5 8 13.5 8s-2.2 3.5-5.5 3.5S2.5 8 2.5 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M3.5 12.5 12.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </MenuGlyph>
  );
}

function PlusIcon() {
  return (
    <MenuGlyph>
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </MenuGlyph>
  );
}

function CheckIcon() {
  return (
    <MenuGlyph>
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </MenuGlyph>
  );
}

function SortIndicator({ direction }: { direction: 'asc' | 'desc' }) {
  return (
    <span aria-hidden className="ml-1 text-heading">
      {direction === 'asc' ? '↑' : '↓'}
    </span>
  );
}

function sortHeaderAriaLabel(label: string, active: boolean, direction: 'asc' | 'desc'): string {
  if (!active) return `Sort by ${label}`;
  return `${label}, sorted ${direction === 'asc' ? 'ascending' : 'descending'}`;
}

function hiddenColumns(
  columns: readonly TableColumn[],
  visibility: Readonly<Partial<TableColumnVisibility>>,
  order: readonly string[] | null | undefined,
): TableColumn[] {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const hidden: TableColumn[] = [];
  for (const id of normalizeTableColumnOrder(columns, order)) {
    const column = byId.get(id);
    if (!column || column.locked || isTableColumnVisible(column, visibility)) continue;
    hidden.push(column);
  }
  return hidden;
}

function ColumnMenuPanel({
  column,
  columns,
  visibility,
  order,
  onVisibilityChange,
  onOrderChange,
  sort,
  onSortChange,
}: {
  column: TableColumn;
  columns: readonly TableColumn[];
  visibility: Readonly<Partial<TableColumnVisibility>>;
  order: readonly string[] | null | undefined;
  onVisibilityChange: (next: TableColumnVisibility) => void;
  onOrderChange: (next: readonly string[]) => void;
  sort: ColumnSortState | null;
  onSortChange?: (next: ColumnSortState) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const listId = useId().replace(/:/g, '');
  const firstHiddenRef = useRef<HTMLButtonElement>(null);
  const hidden = hiddenColumns(columns, visibility, order);
  const sorted = sort?.columnId === column.id;
  const canSort = Boolean(column.sortable && onSortChange);
  const canMoveLeft = canMoveTableColumn(columns, visibility, order, column.id, -1);
  const canMoveRight = canMoveTableColumn(columns, visibility, order, column.id, 1);
  const canHide = !column.locked;

  useEffect(() => {
    if (addOpen) firstHiddenRef.current?.focus();
  }, [addOpen]);

  const itemClass = menuDenseItemClass;

  return (
    <>
      {canSort ? (
        <>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={sorted && sort?.direction === 'asc'}
            className={itemClass}
            onClick={() => onSortChange?.({ columnId: column.id, direction: 'asc' })}
          >
            <ArrowUpIcon />
            <span className="flex-1">Sort ascending</span>
            {sorted && sort?.direction === 'asc' ? <CheckIcon /> : null}
          </button>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={sorted && sort?.direction === 'desc'}
            className={itemClass}
            onClick={() => onSortChange?.({ columnId: column.id, direction: 'desc' })}
          >
            <ArrowDownIcon />
            <span className="flex-1">Sort descending</span>
            {sorted && sort?.direction === 'desc' ? <CheckIcon /> : null}
          </button>
        </>
      ) : null}
      <button
        type="button"
        role="menuitem"
        className={itemClass}
        disabled={!canMoveLeft}
        title={canMoveLeft ? undefined : moveBlockedReason(column, 'left')}
        onClick={() => onOrderChange(moveTableColumn(columns, visibility, order, column.id, -1))}
      >
        <ArrowLeftIcon />
        Move left
      </button>
      <button
        type="button"
        role="menuitem"
        className={itemClass}
        disabled={!canMoveRight}
        title={canMoveRight ? undefined : moveBlockedReason(column, 'right')}
        onClick={() => onOrderChange(moveTableColumn(columns, visibility, order, column.id, 1))}
      >
        <ArrowRightIcon />
        Move right
      </button>
      <button
        type="button"
        role="menuitem"
        className={itemClass}
        disabled={!canHide}
        title={canHide ? undefined : 'This column stays visible'}
        onClick={() =>
          onVisibilityChange(setTableColumnVisible(columns, visibility, column.id, false))
        }
      >
        <HideIcon />
        Hide column
      </button>
      <button
        type="button"
        role="menuitem"
        className={itemClass}
        data-menu-stay=""
        aria-expanded={addOpen}
        aria-controls={listId}
        disabled={hidden.length === 0}
        title={hidden.length === 0 ? 'Every column is already shown' : undefined}
        onClick={() => setAddOpen((open) => !open)}
      >
        <PlusIcon />
        <span className="flex-1 text-left">Add column</span>
      </button>
      {addOpen && hidden.length > 0 ? (
        <div id={listId} role="group" aria-label="Add column">
          {hidden.map((hiddenColumn, index) => (
            <button
              key={hiddenColumn.id}
              ref={index === 0 ? firstHiddenRef : undefined}
              type="button"
              role="menuitem"
              className={`${itemClass} pl-8`}
              onClick={() =>
                onVisibilityChange(
                  setTableColumnVisible(columns, visibility, hiddenColumn.id, true),
                )
              }
            >
              <PlusIcon />
              {hiddenColumn.label}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}

function moveBlockedReason(column: TableColumn, direction: 'left' | 'right'): string {
  if (column.locked) return 'This column stays in place';
  return direction === 'left' ? 'Already the first column' : 'Already the last column';
}

export function ColumnHeader({
  column,
  columns,
  visibility,
  order,
  onVisibilityChange,
  onOrderChange,
  sort = null,
  onSortChange,
  className,
  labelClassName,
}: {
  column: TableColumn;
  columns: readonly TableColumn[];
  visibility: Readonly<Partial<TableColumnVisibility>>;
  order?: readonly string[] | null;
  onVisibilityChange: (next: TableColumnVisibility) => void;
  onOrderChange: (next: readonly string[]) => void;
  sort?: ColumnSortState | null;
  onSortChange?: (next: ColumnSortState) => void;
  className?: string;
  labelClassName?: string;
}) {
  const active = sort?.columnId === column.id;
  const ariaSort = column.sortable
    ? active
      ? sort.direction === 'asc'
        ? 'ascending'
        : 'descending'
      : 'none'
    : undefined;
  const labelClass = ['whitespace-nowrap', labelClassName].filter(Boolean).join(' ');
  const resolvedOrder = normalizeTableColumnOrder(columns, order);
  const widthClass = className?.includes('min-w-') ? undefined : 'min-w-max';

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      aria-label={column.label}
      className={[
        'group/col box-border h-10 whitespace-nowrap px-2 align-middle font-medium leading-5',
        widthClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex h-full w-full flex-nowrap items-center gap-1">
        {column.sortable && onSortChange ? (
          <button
            type="button"
            onClick={() => onSortChange(toggleColumnSort(sort, column.id))}
            aria-label={sortHeaderAriaLabel(column.label, active, sort?.direction ?? 'asc')}
            className={`inline-flex min-w-0 flex-1 items-center px-1 text-left text-text-2 hover:text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong ${labelClass}`}
          >
            <span className="whitespace-nowrap">{column.label}</span>
            {active ? <SortIndicator direction={sort.direction} /> : null}
          </button>
        ) : (
          <span className={`inline-flex min-w-0 flex-1 items-center px-1 ${labelClass}`}>
            {column.label}
          </span>
        )}
        <Menu
          focusFirstItem
          label={columnMenuButtonLabel(column.label)}
          triggerAriaLabel={columnMenuButtonLabel(column.label)}
          trigger={<KebabIcon />}
          triggerClassName={triggerClassName}
        >
          <ColumnMenuPanel
            column={column}
            columns={columns}
            visibility={visibility}
            order={resolvedOrder}
            onVisibilityChange={onVisibilityChange}
            onOrderChange={onOrderChange}
            sort={sort}
            onSortChange={onSortChange}
          />
        </Menu>
      </div>
    </th>
  );
}
