import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import {
  FACET_LONG_GROUP_OPTION_THRESHOLD,
  FACET_OPTION_LIST_SCROLL_CAP_PX,
  facetOptionListShowsSearch,
} from '../catalog/facetOptionListLayout.ts';
import { formatOptionMatchesQuery } from './formatFilterSearch.ts';
import { FormatCatalogNameLabel, formatCatalogOptionAriaLabel } from './FormatCatalogNameLabel.tsx';
import { listFormatsNewestFirst, type FormatId } from './formatCatalog.ts';

type FormatFilterGroupProps = {
  value: FormatId | null;
  onChange: (formatId: FormatId | null) => void;
};

type FormatOption = {
  id: FormatId | null;
  name: string;
};

function formatTriggerLabel(
  value: FormatId | null,
  formats: ReadonlyArray<{ id: FormatId; name: string }>,
): string {
  if (!value) return 'None';
  return formats.find((format) => format.id === value)?.name ?? value;
}

function FormatOptionRow({
  name,
  selected,
  onSelect,
}: {
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-label={formatCatalogOptionAriaLabel(name)}
      onClick={onSelect}
      className="flex min-h-9 w-full items-center gap-2 px-3 text-left text-sm font-normal text-text hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong"
    >
      <span
        aria-hidden="true"
        className={`inline-flex size-4 shrink-0 items-center justify-center rounded-full border ${
          selected ? 'border-border-strong bg-heading' : 'border-border bg-surface'
        }`}
      >
        {selected ? <span className="size-1.5 rounded-full bg-on-accent" /> : null}
      </span>
      <FormatCatalogNameLabel name={name} />
    </button>
  );
}

export function FormatFilterGroup({ value, onChange }: FormatFilterGroupProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const formats = useMemo(() => listFormatsNewestFirst(), []);
  const triggerLabel = formatTriggerLabel(value, formats);

  const options: FormatOption[] = useMemo(() => {
    const none: FormatOption = { id: null, name: 'None' };
    return [none, ...formats.map((format) => ({ id: format.id, name: format.name }))];
  }, [formats]);

  const showSearch = facetOptionListShowsSearch(
    options.length >= FACET_LONG_GROUP_OPTION_THRESHOLD,
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => formatOptionMatchesQuery(option, normalized));
  }, [options, query]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDropdown();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, closeDropdown]);

  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <span id={`${listId}-label`} className="sr-only">
        Format
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${listId}-label`}
        onClick={() => {
          if (open) closeDropdown();
          else setOpen(true);
        }}
        className="flex min-h-[var(--touch-min)] w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-left text-sm font-normal text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
      >
        <span className="min-w-0 truncate">{triggerLabel}</span>
        <span aria-hidden="true" className="shrink-0 text-text-2">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border border-border bg-surface shadow-lg">
          {showSearch ? (
            <div className="border-b border-border px-2 py-2">
              <label className="sr-only" htmlFor="format-filter-search">
                Search formats
              </label>
              <input
                ref={searchInputRef}
                id="format-filter-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search formats…"
                className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text placeholder:text-text-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
              />
            </div>
          ) : null}
          <ul
            role="listbox"
            aria-labelledby={`${listId}-label`}
            className="max-h-[min(16rem,var(--format-filter-max,16rem))] overflow-y-auto py-1"
            style={{ maxHeight: `${FACET_OPTION_LIST_SCROLL_CAP_PX}px` }}
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-2">No formats match.</li>
            ) : (
              filteredOptions.map((option) => {
                const selected = value === option.id;
                return (
                  <li key={option.id ?? 'none'} role="none">
                    <FormatOptionRow
                      name={option.name}
                      selected={selected}
                      onSelect={() => {
                        onChange(option.id);
                        closeDropdown();
                      }}
                    />
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
