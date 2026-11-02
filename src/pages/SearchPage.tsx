import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import { CardCatalogView } from '../catalog/CardCatalogView';
import { CatalogViewToggle } from '../catalog/CatalogViewToggle.tsx';
import {
  CATALOG_VIEW_QUERY_KEY,
  CATALOG_VIEW_STORAGE_KEY_SEARCH,
  CATALOG_WIDE_LAYOUT_MIN_WIDTH_PX,
  displayCatalogViewMode,
  type CatalogViewMode,
  readCatalogViewPreference,
  resolveCatalogViewPreference,
  writeCatalogViewPreference,
} from '../catalog/catalogViewMode.ts';
import { FORMAT_QUERY_KEY } from '../catalog/formatBanContext.ts';
import { FacetFilterPanel, PhoneFiltersSheet } from '../catalog/FacetFilterPanel.tsx';
import { FilterChips } from '../catalog/FilterChips.tsx';
import { getCatalogDerived } from '../catalog/catalogDerived.ts';
import { queryCatalog } from '../catalog/catalogQueryCache.ts';
import {
  emptyFilterState,
  resolveFilterStateUpdater,
  type FilterState,
  type FilterStateUpdater,
} from '../catalog/filterEngine.ts';
import { formatCardCount } from '../catalog/formatCardCount.ts';
import {
  countActiveFacetSelections,
  filterStateToChips,
  readFilterStateFromParams,
  writeFilterStateToParams,
} from '../catalog/filterUrlState.ts';
import { withoutSearchScrollRestore } from '../catalog/searchScrollRestore.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import { CatalogTableColumnsMenu } from '../catalog/CatalogTableColumnsMenu.tsx';
import {
  DEFAULT_CATALOG_TABLE_COLUMN_VISIBILITY,
  type CatalogTableColumnVisibility,
} from '../catalog/catalogTableColumns.ts';
import {
  DEFAULT_CATALOG_TABLE_SORT,
  type CatalogTableSortState,
} from '../catalog/catalogTableSort.ts';
import { useMinViewportWidth } from '../hooks/useMinViewportWidth.ts';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
const SEARCH_DEBOUNCE_MS = 180;

export function SearchPage() {
  const headingId = 'search-heading';
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const filterState = useMemo(() => readFilterStateFromParams(searchParams), [searchParams]);
  const resolvedViewPreference = useMemo(
    () =>
      resolveCatalogViewPreference({
        urlParam: searchParams.get(CATALOG_VIEW_QUERY_KEY),
        storedRaw: readCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH),
        defaultMode: 'grid',
      }),
    [searchParams],
  );
  const viewMode = resolvedViewPreference.mode;
  const formatParam = searchParams.get(FORMAT_QUERY_KEY);
  const filterStateRef = useRef(filterState);
  useEffect(() => {
    filterStateRef.current = filterState;
  }, [filterState]);
  const { state: catalogState } = useCardCatalog();
  const [phoneFiltersOpen, setPhoneFiltersOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState<FilterState>(filterState);
  const tableViewportOk = useMinViewportWidth(CATALOG_WIDE_LAYOUT_MIN_WIDTH_PX);
  const [tableColumnVisibility, setTableColumnVisibility] = useState<CatalogTableColumnVisibility>(
    () => ({ ...DEFAULT_CATALOG_TABLE_COLUMN_VISIBILITY }),
  );
  const [tableSort, setTableSort] = useState<CatalogTableSortState>(() => ({
    ...DEFAULT_CATALOG_TABLE_SORT,
  }));

  const effectiveViewMode = displayCatalogViewMode(resolvedViewPreference, {
    tableAvailable: tableViewportOk,
  });

  const catalogSetIndex = catalogState.status === 'ready' ? catalogState.setIndex : undefined;

  const trimmedQuery = debouncedQuery.trim();

  const catalogDerived = useMemo(() => {
    if (catalogState.status !== 'ready') return null;
    return getCatalogDerived(catalogState.cards);
  }, [catalogState]);

  const catalogFieldIds = useMemo(() => {
    if (!catalogDerived) return [];
    return catalogDerived.filterEngine.fieldsWithCatalog();
  }, [catalogDerived]);

  const facetGroupCounts = useMemo(() => {
    if (!catalogDerived) return [];
    return queryCatalog(catalogDerived, { filterState, query: trimmedQuery }).facetGroupCounts;
  }, [catalogDerived, filterState, trimmedQuery]);

  const draftFacetGroupCounts = useMemo(() => {
    if (!catalogDerived) return [];
    return queryCatalog(catalogDerived, { filterState: phoneDraft, query: trimmedQuery })
      .facetGroupCounts;
  }, [catalogDerived, phoneDraft, trimmedQuery]);

  const draftMatchCount = useMemo(() => {
    if (!catalogDerived) return 0;
    return queryCatalog(catalogDerived, { filterState: phoneDraft, query: trimmedQuery })
      .matchCount;
  }, [catalogDerived, phoneDraft, trimmedQuery]);

  const matchCount = useMemo(() => {
    if (!catalogDerived) return 0;
    return queryCatalog(catalogDerived, { filterState, query: trimmedQuery }).matchCount;
  }, [catalogDerived, filterState, trimmedQuery]);

  const activeFilterCount = countActiveFacetSelections(filterState);
  const chips = useMemo(() => filterStateToChips(filterState), [filterState]);

  const commitFilterState = useCallback(
    (next: FilterStateUpdater) => {
      const resolved = resolveFilterStateUpdater(next, filterStateRef.current);
      filterStateRef.current = resolved;
      const params = new URLSearchParams(searchParams);
      writeFilterStateToParams(params, resolved);
      const search = params.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : '' },
        { replace: true, state: withoutSearchScrollRestore(location.state) },
      );
    },
    [location.pathname, location.state, navigate, searchParams],
  );

  const setViewMode = useCallback(
    (mode: CatalogViewMode) => {
      writeCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH, mode);
      const params = new URLSearchParams(searchParams);
      if (mode === 'grid') {
        params.delete(CATALOG_VIEW_QUERY_KEY);
      } else {
        params.set(CATALOG_VIEW_QUERY_KEY, mode);
      }
      const search = params.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : '' },
        { replace: true, state: withoutSearchScrollRestore(location.state) },
      );
    },
    [location.pathname, location.state, navigate, searchParams],
  );

  useEffect(() => {
    const next = trimmedQuery;
    const current = searchParams.get('q') ?? '';
    if (next === current) return;

    const params = new URLSearchParams(searchParams);
    if (next.length === 0) {
      params.delete('q');
    } else {
      params.set('q', next);
    }
    const search = params.toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '' },
      { replace: true, state: withoutSearchScrollRestore(location.state) },
    );
  }, [trimmedQuery, location.pathname, location.state, navigate, searchParams]);

  const openPhoneFilters = () => {
    setPhoneDraft(filterState);
    setPhoneFiltersOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 id={headingId} className="text-2xl font-semibold text-heading">
        Search
      </h1>
      <label htmlFor="card-search-input" className="flex flex-col gap-2">
        <span className="text-sm font-medium text-heading">Find a card</span>
        <input
          id="card-search-input"
          type="search"
          name="card-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or passcode"
          autoComplete="off"
          spellCheck={false}
          className="min-h-[var(--touch-min)] w-full rounded-md border border-border bg-surface px-3 text-base text-text placeholder:text-text-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        />
      </label>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        {catalogDerived ? (
          <aside aria-label="Filter sidebar" className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-[calc(var(--touch-min)+1rem)] max-h-[calc(100dvh-6rem)] overflow-y-auto pr-1">
              <FacetFilterPanel
                filterState={filterState}
                groupCounts={facetGroupCounts}
                catalogFieldIds={catalogFieldIds}
                onChange={commitFilterState}
                setIndex={catalogSetIndex}
              />
            </div>
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={openPhoneFilters}
              className="inline-flex min-h-[var(--touch-min)] items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
            >
              Filters
              {activeFilterCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-surface-2 px-1.5 text-xs font-semibold tabular-nums">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text-2" aria-live="polite">
                {formatCardCount(matchCount)}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {effectiveViewMode === 'table' ? (
                  <CatalogTableColumnsMenu
                    visibility={tableColumnVisibility}
                    onChange={setTableColumnVisibility}
                  />
                ) : null}
                <CatalogViewToggle value={effectiveViewMode} onChange={setViewMode} />
              </div>
            </div>
            {chips.length > 0 ? <FilterChips chips={chips} onChange={commitFilterState} /> : null}
          </div>

          <CardCatalogView
            headingId={headingId}
            searchQuery={debouncedQuery}
            filterState={filterState}
            showResultCount={false}
            viewMode={viewMode}
            formatParam={formatParam}
            tableAvailable={tableViewportOk}
            tableColumnVisibility={tableColumnVisibility}
            tableSort={tableSort}
            onTableSortChange={setTableSort}
          />
        </div>
      </div>

      {catalogDerived ? (
        <PhoneFiltersSheet
          open={phoneFiltersOpen}
          onClose={() => setPhoneFiltersOpen(false)}
          draftState={phoneDraft}
          onDraftChange={(next) => setPhoneDraft((prev) => resolveFilterStateUpdater(next, prev))}
          onReset={() => setPhoneDraft(emptyFilterState())}
          onApply={() => {
            commitFilterState(phoneDraft);
            setPhoneFiltersOpen(false);
          }}
          resultCount={draftMatchCount}
          draftGroupCounts={draftFacetGroupCounts}
          catalogFieldIds={catalogFieldIds}
          setIndex={catalogSetIndex}
        />
      ) : null}
    </div>
  );
}
