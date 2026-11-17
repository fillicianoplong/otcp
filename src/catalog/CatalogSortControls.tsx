import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { Combobox, type ComboboxOption } from '../ui/Combobox.tsx';
import { focusRingClass } from '../ui/classes.ts';
import { CATALOG_TABLE_SORTABLE_COLUMN_DEFS } from './catalogTableColumns.ts';
import type { CatalogTableSortColumnId } from './catalogTableColumns.ts';
import type { CatalogTableSortState } from './catalogTableSort.ts';

const SORT_FIELDS = CATALOG_TABLE_SORTABLE_COLUMN_DEFS;

function isPrintableKey(event: KeyboardEvent<HTMLElement>): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

function DirectionArrow({ direction }: { direction: 'asc' | 'desc' }) {
  const ascending = direction === 'asc';
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none">
      <path
        d={ascending ? 'M8 12.5V3.5M4.5 7 8 3.5 11.5 7' : 'M8 3.5v9M4.5 9 8 12.5 11.5 9'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const directionButtonClass = `inline-flex h-touch w-touch shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-2 hover:border-border-strong hover:text-heading ${focusRingClass}`;

function SortFieldCombobox({
  value,
  onChange,
}: {
  value: CatalogTableSortColumnId;
  onChange: (column: CatalogTableSortColumnId) => void;
}) {
  const rawId = useId().replace(/:/g, '');
  const inputId = `${rawId}-sort-field`;
  const listId = `${rawId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const normalized = (open ? query : '').trim().toLowerCase();
    if (!normalized) return [...SORT_FIELDS];
    return SORT_FIELDS.filter((field) => field.label.toLowerCase().includes(normalized));
  }, [open, query]);
  const selectedIndex = SORT_FIELDS.findIndex((field) => field.id === value);
  const valueLabel = SORT_FIELDS.find((field) => field.id === value)?.label ?? value;
  const activeIndexClamped =
    filtered.length === 0 ? -1 : Math.min(Math.max(activeIndex, 0), filtered.length - 1);
  const activeField = activeIndexClamped >= 0 ? filtered[activeIndexClamped] : undefined;

  const closeList = () => {
    setOpen(false);
    setQuery('');
  };

  const openList = (nextActive: number) => {
    setOpen(true);
    setQuery('');
    setActiveIndex(nextActive);
  };

  const selectField = (column: CatalogTableSortColumnId) => {
    onChange(column);
    closeList();
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeList();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || !activeField) return;
    const node = document.getElementById(`${rawId}-opt-${activeField.id}`);
    if (!node || typeof node.scrollIntoView !== 'function') return;
    node.scrollIntoView({ block: 'nearest' });
  }, [activeField, open, rawId]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      if (!open) return;
      event.preventDefault();
      event.stopPropagation();
      closeList();
      inputRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        const start = selectedIndex >= 0 ? selectedIndex : 0;
        openList(Math.min(start + 1, SORT_FIELDS.length - 1));
        return;
      }
      setActiveIndex((current) => {
        if (filtered.length === 0) return -1;
        const base = current < 0 ? -1 : Math.min(current, filtered.length - 1);
        return Math.min(base + 1, filtered.length - 1);
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        const start = selectedIndex >= 0 ? selectedIndex : 0;
        openList(Math.max(start - 1, 0));
        return;
      }
      setActiveIndex((current) => {
        if (filtered.length === 0) return -1;
        const base = current < 0 ? 0 : Math.min(current, filtered.length - 1);
        return Math.max(base - 1, 0);
      });
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (!open) {
        openList(selectedIndex >= 0 ? selectedIndex : 0);
        return;
      }
      if (activeField) selectField(activeField.id);
      return;
    }

    if (!open && isPrintableKey(event)) {
      event.preventDefault();
      setOpen(true);
      setQuery(event.key);
      setActiveIndex(0);
    }
  };

  const options: ComboboxOption[] = filtered.map((field) => ({
    id: field.id,
    label: field.label,
  }));

  return (
    <Combobox
      label="Field"
      inputId={inputId}
      listId={listId}
      open={open}
      query={query}
      valueLabel={valueLabel}
      placeholder="Field"
      options={options}
      activeIndex={activeIndexClamped}
      selectedId={value}
      emptyMessage="No fields match."
      optionDomId={(id) => `${rawId}-opt-${id}`}
      inputRef={inputRef}
      rootRef={rootRef}
      caretHidden
      disclosureLabel={{ open: 'Hide fields', closed: 'Show fields' }}
      onQueryChange={(next) => {
        setQuery(next);
        setActiveIndex(0);
      }}
      onOpen={() => openList(selectedIndex >= 0 ? selectedIndex : 0)}
      onClose={closeList}
      onActiveIndex={setActiveIndex}
      onSelect={(id) => {
        if (SORT_FIELDS.some((field) => field.id === id)) {
          selectField(id as CatalogTableSortColumnId);
        }
      }}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && rootRef.current?.contains(next)) return;
        if (open) closeList();
      }}
    />
  );
}

/** Field list and direction toggle for the Sort section in a filters panel. */
export function CatalogSortControls({
  sort,
  onChange,
}: {
  sort: CatalogTableSortState;
  onChange: (next: CatalogTableSortState) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <SortFieldCombobox
          value={sort.column}
          onChange={(column) => onChange({ column, direction: sort.direction })}
        />
      </div>
      <button
        type="button"
        aria-label={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
        title={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
        onClick={() =>
          onChange({
            column: sort.column,
            direction: sort.direction === 'asc' ? 'desc' : 'asc',
          })
        }
        className={directionButtonClass}
      >
        <DirectionArrow direction={sort.direction} />
      </button>
    </div>
  );
}
