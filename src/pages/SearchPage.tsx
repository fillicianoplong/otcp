import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import { CardCatalogView } from '../catalog/CardCatalogView';
import { FacetFilterPanel, PhoneFiltersSheet } from '../catalog/FacetFilterPanel.tsx';
import { FilterChips } from '../catalog/FilterChips.tsx';
import {
  buildFilterEngine,
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
import { readSetFacetSortMode, writeSetFacetSortMode } from '../catalog/setFacetSort.ts';
import type { SetFacetSortMode } from '../catalog/facetOptionOrdering.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { buildSearchIndex } from '../search/index.ts';

const SEARCH_DEBOUNCE_MS = 180;

export function SearchPage() {
  const headingId = 'search-heading';
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const filterState = useMemo(() => readFilterStateFromParams(searchParams), [searchParams]);
  const filterStateRef = useRef(filterState);
  useEffect(() => {
    filterStateRef.current = filterState;
  }, [filterState]);
  const { state: catalogState } = useCardCatalog();
  const [phoneFiltersOpen, setPhoneFiltersOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState<FilterState>(filterState);
  const [setSortMode, setSetSortMode] = useState<SetFacetSortMode>(() => readSetFacetSortMode());

  const catalogSetIndex = catalogState.status === 'ready' ? catalogState.setIndex : undefined;

  const handleSetSortModeChange = useCallback((mode: SetFacetSortMode) => {
    setSetSortMode(mode);
    writeSetFacetSortMode(mode);
  }, []);

  const trimmedQuery = debouncedQuery.trim();

  const searchIndex = useMemo(() => {
    if (catalogState.status !== 'ready') return null;
    return buildSearchIndex(catalogState.cards);
  }, [catalogState]);

  const filterEngine = useMemo(() => {
    if (catalogState.status !== 'ready') return null;
    return buildFilterEngine(catalogState.cards);
  }, [catalogState]);

  const searchIds = useMemo(() => {
    if (!trimmedQuery || !searchIndex) return undefined;
    return searchIndex.query(trimmedQuery).ids;
  }, [searchIndex, trimmedQuery]);

  const searchApplyOptions = useMemo(() => (searchIds ? { searchIds } : {}), [searchIds]);

  const catalogFieldIds = useMemo(() => {
    if (!filterEngine) return [];
    return filterEngine.fieldsWithCatalog();
  }, [filterEngine]);

  const facetGroupCounts = useMemo(() => {
    if (!filterEngine) return [];
    return filterEngine.recount(filterState, searchApplyOptions);
  }, [filterEngine, filterState, searchApplyOptions]);

  const draftFacetGroupCounts = useMemo(() => {
    if (!filterEngine) return [];
    return filterEngine.recount(phoneDraft, searchApplyOptions);
  }, [filterEngine, phoneDraft, searchApplyOptions]);

  const draftMatchCount = useMemo(() => {
    if (!filterEngine) return 0;
    return filterEngine.apply(phoneDraft, searchApplyOptions).count;
  }, [filterEngine, phoneDraft, searchApplyOptions]);

  const matchCount = useMemo(() => {
    if (!filterEngine) return 0;
    return filterEngine.apply(filterState, searchApplyOptions).count;
  }, [filterEngine, filterState, searchApplyOptions]);

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
        {filterEngine ? (
          <aside aria-label="Filter sidebar" className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-[calc(var(--touch-min)+1rem)] max-h-[calc(100dvh-6rem)] overflow-y-auto pr-1">
              <FacetFilterPanel
                filterState={filterState}
                groupCounts={facetGroupCounts}
                catalogFieldIds={catalogFieldIds}
                onChange={commitFilterState}
                setIndex={catalogSetIndex}
                setSortMode={setSortMode}
                onSetSortModeChange={handleSetSortModeChange}
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
            {chips.length > 0 ? (
              <>
                <p className="text-sm text-text-2" aria-live="polite">
                  {formatCardCount(matchCount)}
                </p>
                <FilterChips chips={chips} onChange={commitFilterState} />
              </>
            ) : (
              <p className="text-sm text-text-2" aria-live="polite">
                {formatCardCount(matchCount)}
              </p>
            )}
          </div>

          <CardCatalogView
            headingId={headingId}
            searchQuery={debouncedQuery}
            filterState={filterState}
            showResultCount={false}
          />
        </div>
      </div>

      {filterEngine ? (
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
          setSortMode={setSortMode}
          onSetSortModeChange={handleSetSortModeChange}
        />
      ) : null}
    </div>
  );
}
