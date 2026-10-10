import { useMemo, useState } from 'react';

import {
  FACET_LONG_GROUP_OPTION_THRESHOLD,
  FACET_OPTION_LIST_SCROLL_CAP_PX,
  facetOptionListShowsSearch,
  facetOptionListUsesInnerScroll,
  facetOptionShowMoreLess,
  facetOptionVisibleCount,
} from '../catalog/facetOptionListLayout.ts';
import { formatOptionMatchesQuery } from './formatFilterSearch.ts';
import { FormatCatalogNameLabel, formatCatalogOptionAriaLabel } from './FormatCatalogNameLabel.tsx';
import { listFormatsNewestFirst, type FormatId } from './formatCatalog.ts';
import type { FormatOptionPoolCounts } from '../catalog/formatOptionPoolCounts.ts';

type FormatFilterGroupProps = {
  value: FormatId | null;
  onChange: (formatId: FormatId | null) => void;
  /** Per-format pool sizes with the current query and facet filters applied. */
  poolCountsByFormatId?: FormatOptionPoolCounts;
};

type FormatOption = {
  id: FormatId | null;
  name: string;
};

function FormatOptionRow({
  name,
  selected,
  count,
  onSelect,
}: {
  name: string;
  selected: boolean;
  count?: number;
  onSelect: () => void;
}) {
  const ariaLabel = formatCatalogOptionAriaLabel(name);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
      className="flex min-h-8 w-full items-center gap-2 rounded-sm text-left text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
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
      {count != null ? (
        <span className="ml-auto shrink-0 tabular-nums text-text-2">{count.toLocaleString()}</span>
      ) : null}
    </button>
  );
}

export function FormatFilterGroup({
  value,
  onChange,
  poolCountsByFormatId,
}: FormatFilterGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);
  const [query, setQuery] = useState('');

  const options: FormatOption[] = useMemo(() => {
    const none: FormatOption = { id: null, name: 'None' };
    const formats = listFormatsNewestFirst().map((format) => ({
      id: format.id,
      name: format.name,
    }));
    return [none, ...formats];
  }, []);

  const isLongList = options.length >= FACET_LONG_GROUP_OPTION_THRESHOLD;
  const showSearch = facetOptionListShowsSearch(isLongList);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => formatOptionMatchesQuery(option, normalized));
  }, [options, query]);

  const searching = query.trim().length > 0;
  const visibleCount = searching
    ? filteredOptions.length
    : facetOptionVisibleCount(filteredOptions.length, listExpanded);
  const visibleOptions = filteredOptions.slice(0, visibleCount);
  const showMoreLess = searching
    ? null
    : facetOptionShowMoreLess(filteredOptions.length, listExpanded);
  const listScrollable = searching || facetOptionListUsesInnerScroll(isLongList, listExpanded);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <button
        type="button"
        className="flex min-h-10 w-full items-center justify-between gap-2 bg-surface-2 px-3 py-2 text-left text-sm font-medium text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((open) => !open)}
      >
        <span className="min-w-0 truncate">Format</span>
        <span aria-hidden="true" className="shrink-0 text-text-2">
          {collapsed ? '▸' : '▾'}
        </span>
      </button>
      {!collapsed ? (
        <div className="flex flex-col gap-2 px-3 py-3" role="radiogroup" aria-label="Format">
          {showSearch ? (
            <>
              <label className="sr-only" htmlFor="format-filter-search">
                Search formats
              </label>
              <input
                id="format-filter-search"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setListExpanded(false);
                }}
                placeholder="Search formats…"
                className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text placeholder:text-text-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
              />
            </>
          ) : null}
          <div
            className={listScrollable ? 'overflow-y-auto pr-1' : undefined}
            style={
              listScrollable ? { maxHeight: `${FACET_OPTION_LIST_SCROLL_CAP_PX}px` } : undefined
            }
          >
            {filteredOptions.length === 0 ? (
              <p className="py-1 text-sm text-text-2">No formats match.</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {visibleOptions.map((option) => {
                  const selected = value === option.id;
                  return (
                    <li key={option.id ?? 'none'}>
                      <FormatOptionRow
                        name={option.name}
                        selected={selected}
                        count={option.id ? poolCountsByFormatId?.[option.id] : undefined}
                        onSelect={() => onChange(option.id)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {showMoreLess === 'more' ? (
            <button
              type="button"
              onClick={() => setListExpanded(true)}
              className="text-left text-sm text-text underline decoration-border underline-offset-2 hover:text-heading"
            >
              Show more
            </button>
          ) : null}
          {showMoreLess === 'less' ? (
            <button
              type="button"
              onClick={() => setListExpanded(false)}
              className="text-left text-sm text-text underline decoration-border underline-offset-2 hover:text-heading"
            >
              Show less
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
