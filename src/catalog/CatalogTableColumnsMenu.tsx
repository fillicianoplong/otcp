import { useEffect, useId, useRef, useState } from 'react';

import {
  CATALOG_TABLE_OPTIONAL_COLUMN_DEFS,
  type CatalogTableColumnVisibility,
  type CatalogTableOptionalColumnId,
} from './catalogTableColumns.ts';

export function CatalogTableColumnsMenu({
  visibility,
  onChange,
}: {
  visibility: CatalogTableColumnVisibility;
  onChange: (next: CatalogTableColumnVisibility) => void;
}) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggleColumn = (columnId: CatalogTableOptionalColumnId) => {
    onChange({ ...visibility, [columnId]: !visibility[columnId] });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border bg-surface px-3 text-sm font-medium text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
      >
        Columns
        <span aria-hidden className="text-text-2">
          ▾
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Table columns"
          className="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-md border border-border bg-surface py-1 shadow-sm"
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
        </div>
      ) : null}
    </div>
  );
}
