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
} from '../catalog/catalogViewMode.ts';
import {
  persistSearchCardViewPreference,
  persistSearchTablePreferences,
  readSearchTablePrefsForUi,
  useProfileViewPreferenceRevision,
} from '../shared/profile';
import { FORMAT_QUERY_KEY } from '../catalog/formatBanContext.ts';
import { formatDisplayName } from '../format/formatCatalog.ts';
import {
  applyFormatToSearchParams,
  readFormatPreference,
  resolveFormatPreference,
  writeFormatPreference,
} from '../format/formatPreference.ts';
import type { FormatId } from '../format/formatCatalog.ts';
import { FacetFilterPanel, PhoneFiltersSheet } from '../catalog/FacetFilterPanel.tsx';
import { FilterChips } from '../catalog/FilterChips.tsx';
import { Button } from '../ui/Button.tsx';
import { Chip } from '../ui/Chip.tsx';
import { Input } from '../ui/Input.tsx';
import { PageContainer } from '../ui/PageContainer.tsx';
import { PageTitle } from '../ui/PageTitle.tsx';
import { Toolbar } from '../ui/Toolbar.tsx';
import { getCatalogDerived } from '../catalog/catalogDerived.ts';
import { queryCatalog } from '../catalog/catalogQueryCache.ts';
import {
  emptyFilterState,
  resolveFilterStateUpdater,
  type FilterState,
  type FilterStateUpdater,
} from '../catalog/filterEngine.ts';
import { formatCatalogResultCount } from '../catalog/formatCardCount.ts';
import { ALL_ARTWORKS_QUERY_KEY } from '../catalog/allArtworksPreference.ts';
import { expandCardsToArtTiles, catalogResultCount } from '../catalog/cardArt.ts';
import { useCatalogArtIdWarm } from '../catalog/useCatalogArtIdWarm.ts';
import {
  countActiveFacetSelections,
  filterStateToChips,
  readFilterStateFromParams,
  writeFilterStateToParams,
} from '../catalog/filterUrlState.ts';
import { clearBanStatusSelection } from '../catalog/filterSelection.ts';
import { withoutSearchScrollRestore } from '../catalog/searchScrollRestore.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import { CatalogTableColumnsMenu } from '../catalog/CatalogTableColumnsMenu.tsx';
import { type CatalogTableColumnVisibility } from '../catalog/catalogTableColumns.ts';
import { type CatalogTableSortState } from '../catalog/catalogTableSort.ts';
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
  const profilePreferenceRevision = useProfileViewPreferenceRevision();
  const resolvedViewPreference = useMemo(
    () =>
      resolveCatalogViewPreference({
        urlParam: searchParams.get(CATALOG_VIEW_QUERY_KEY),
        storedRaw: readCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH),
        defaultMode: 'grid',
      }),
    // Re-read localStorage when profile sync applies server preferences.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- profilePreferenceRevision
    [profilePreferenceRevision, searchParams],
  );
  const viewMode = resolvedViewPreference.mode;
  // Mirror the saved format in state. The chip is the clear control, and a saved
  // format can be active when the URL has no format param. Clearing storage alone
  // does not change the query string, so Search would keep the old selection.
  const [storedFormatRaw, setStoredFormatRaw] = useState<string | null>(() =>
    readFormatPreference(),
  );
  const resolvedFormat = useMemo(
    () =>
      resolveFormatPreference({
        urlParam: searchParams.get(FORMAT_QUERY_KEY),
        storedRaw: storedFormatRaw,
      }),
    [searchParams, storedFormatRaw],
  );
  const activeFormatId = resolvedFormat.formatId;
  const formatParam = activeFormatId;
  const filterStateRef = useRef(filterState);
  useEffect(() => {
    filterStateRef.current = filterState;
  }, [filterState]);
  const { state: catalogState } = useCardCatalog();
  const [phoneFiltersOpen, setPhoneFiltersOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState<FilterState>(filterState);
  const [phoneDraftFormatId, setPhoneDraftFormatId] = useState<FormatId | null>(activeFormatId);
  const tableViewportOk = useMinViewportWidth(CATALOG_WIDE_LAYOUT_MIN_WIDTH_PX);
  const [tableColumnVisibility, setTableColumnVisibility] = useState<CatalogTableColumnVisibility>(
    () => readSearchTablePrefsForUi().visibility,
  );
  const [tableSort, setTableSort] = useState<CatalogTableSortState>(
    () => readSearchTablePrefsForUi().sort,
  );

  useEffect(() => {
    if (!searchParams.has(ALL_ARTWORKS_QUERY_KEY)) return;
    const params = new URLSearchParams(searchParams);
    params.delete(ALL_ARTWORKS_QUERY_KEY);
    const search = params.toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '' },
      { replace: true, state: location.state },
    );
  }, [location.pathname, location.state, navigate, searchParams]);

  useEffect(() => {
    const snapshot = readSearchTablePrefsForUi();
    queueMicrotask(() => {
      setTableColumnVisibility(snapshot.visibility);
      setTableSort(snapshot.sort);
    });
  }, [profilePreferenceRevision]);

  const handleTableColumnVisibilityChange = useCallback(
    (next: CatalogTableColumnVisibility) => {
      setTableColumnVisibility(next);
      persistSearchTablePreferences({ visibility: next, sort: tableSort });
    },
    [tableSort],
  );

  const handleTableSortChange = useCallback(
    (next: CatalogTableSortState) => {
      setTableSort(next);
      persistSearchTablePreferences({ visibility: tableColumnVisibility, sort: next });
    },
    [tableColumnVisibility],
  );

  const effectiveViewMode = displayCatalogViewMode(resolvedViewPreference, {
    tableAvailable: tableViewportOk,
  });

  const catalogSetIndex = catalogState.status === 'ready' ? catalogState.setIndex : undefined;

  const trimmedQuery = debouncedQuery.trim();

  const catalogDerived = useMemo(() => {
    if (catalogState.status !== 'ready') return null;
    return getCatalogDerived(catalogState.cards);
  }, [catalogState]);

  const artCacheRevision = useCatalogArtIdWarm(catalogDerived?.cards ?? null);

  const catalogFieldIds = useMemo(() => {
    if (!catalogDerived) return [];
    return catalogDerived.filterEngine.fieldsWithCatalog();
  }, [catalogDerived]);

  const facetGroupCounts = useMemo(() => {
    if (!catalogDerived) return [];
    return queryCatalog(catalogDerived, {
      filterState,
      query: trimmedQuery,
      formatParam: activeFormatId,
      setIndex: catalogSetIndex,
    }).facetGroupCounts;
  }, [activeFormatId, catalogDerived, catalogSetIndex, filterState, trimmedQuery]);

  const draftFacetGroupCounts = useMemo(() => {
    if (!catalogDerived) return [];
    return queryCatalog(catalogDerived, {
      filterState: phoneDraft,
      query: trimmedQuery,
      formatParam: phoneDraftFormatId,
      setIndex: catalogSetIndex,
    }).facetGroupCounts;
  }, [catalogDerived, catalogSetIndex, phoneDraft, phoneDraftFormatId, trimmedQuery]);

  const visibleCardsForArt = useMemo(() => {
    if (!catalogDerived) return [];
    return queryCatalog(catalogDerived, {
      filterState,
      query: trimmedQuery,
      formatParam: activeFormatId,
      setIndex: catalogSetIndex,
    }).visibleCards;
  }, [activeFormatId, catalogDerived, catalogSetIndex, filterState, trimmedQuery]);

  const visibleTileCount = useMemo(() => {
    if (!catalogDerived) return 0;
    void artCacheRevision;
    return catalogResultCount(expandCardsToArtTiles(visibleCardsForArt));
  }, [artCacheRevision, catalogDerived, visibleCardsForArt]);

  const draftVisibleCardsForArt = useMemo(() => {
    if (!catalogDerived) return [];
    return queryCatalog(catalogDerived, {
      filterState: phoneDraft,
      query: trimmedQuery,
      formatParam: phoneDraftFormatId,
      setIndex: catalogSetIndex,
    }).visibleCards;
  }, [catalogDerived, catalogSetIndex, phoneDraft, phoneDraftFormatId, trimmedQuery]);

  const draftVisibleTileCount = useMemo(() => {
    if (!catalogDerived) return 0;
    void artCacheRevision;
    return catalogResultCount(expandCardsToArtTiles(draftVisibleCardsForArt));
  }, [artCacheRevision, catalogDerived, draftVisibleCardsForArt]);

  const activeFilterCount = countActiveFacetSelections(filterState) + (activeFormatId ? 1 : 0);
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

  const persistFormatPreference = useCallback((formatId: FormatId | null) => {
    writeFormatPreference(formatId);
    setStoredFormatRaw(formatId);
  }, []);

  const commitFilterAndFormat = useCallback(
    (nextFilterState: FilterState, formatId: FormatId | null) => {
      const resolved = formatId ? nextFilterState : clearBanStatusSelection(nextFilterState);
      filterStateRef.current = resolved;
      persistFormatPreference(formatId);
      const params = new URLSearchParams(searchParams);
      writeFilterStateToParams(params, resolved);
      applyFormatToSearchParams(params, formatId);
      params.delete(ALL_ARTWORKS_QUERY_KEY);
      const search = params.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : '' },
        { replace: true, state: withoutSearchScrollRestore(location.state) },
      );
    },
    [location.pathname, location.state, navigate, persistFormatPreference, searchParams],
  );

  const setViewMode = useCallback(
    (mode: CatalogViewMode) => {
      persistSearchCardViewPreference(mode);
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

  const setActiveFormat = useCallback(
    (formatId: FormatId | null) => {
      persistFormatPreference(formatId);
      const params = new URLSearchParams(searchParams);
      applyFormatToSearchParams(params, formatId);
      if (!formatId) {
        const cleared = clearBanStatusSelection(filterStateRef.current);
        filterStateRef.current = cleared;
        writeFilterStateToParams(params, cleared);
      }
      const search = params.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : '' },
        { replace: true, state: withoutSearchScrollRestore(location.state) },
      );
    },
    [location.pathname, location.state, navigate, persistFormatPreference, searchParams],
  );

  const clearActiveFormat = useCallback(() => {
    setActiveFormat(null);
  }, [setActiveFormat]);

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
    setPhoneDraftFormatId(activeFormatId);
    setPhoneFiltersOpen(true);
  };

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageTitle id={headingId}>Search</PageTitle>
      <label htmlFor="card-search-input" className="flex flex-col gap-2">
        <span className="text-sm font-medium text-heading">Find a card</span>
        <Input
          id="card-search-input"
          type="search"
          name="card-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or passcode"
          autoComplete="off"
          spellCheck={false}
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
                activeFormatId={activeFormatId}
                onFormatChange={setActiveFormat}
              />
            </div>
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Toolbar
            actions={
              <>
                {effectiveViewMode === 'table' ? (
                  <CatalogTableColumnsMenu
                    visibility={tableColumnVisibility}
                    onChange={handleTableColumnVisibilityChange}
                  />
                ) : null}
                <CatalogViewToggle value={effectiveViewMode} onChange={setViewMode} />
              </>
            }
          >
            <Button variant="toolbar" className="lg:hidden" onClick={openPhoneFilters}>
              {activeFilterCount > 0 ? `Filters · ${activeFilterCount}` : 'Filters'}
            </Button>
            <div className="max-md:hidden md:contents">
              {activeFormatId ? (
                <Chip
                  label={formatDisplayName(activeFormatId)}
                  removeLabel={`Remove ${formatDisplayName(activeFormatId)} format`}
                  onClick={clearActiveFormat}
                />
              ) : null}
              {chips.length > 0 ? <FilterChips chips={chips} onChange={commitFilterState} /> : null}
            </div>
            <p className="text-sm text-text-2" aria-live="polite">
              {formatCatalogResultCount(visibleTileCount)}
            </p>
          </Toolbar>

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
            onTableSortChange={handleTableSortChange}
          />
        </div>
      </div>

      {catalogDerived ? (
        <PhoneFiltersSheet
          open={phoneFiltersOpen}
          onClose={() => setPhoneFiltersOpen(false)}
          draftState={phoneDraft}
          onDraftChange={(next) => setPhoneDraft((prev) => resolveFilterStateUpdater(next, prev))}
          onReset={() => {
            setPhoneDraft(emptyFilterState());
            setPhoneDraftFormatId(null);
          }}
          onApply={() => {
            commitFilterAndFormat(phoneDraft, phoneDraftFormatId);
            setPhoneFiltersOpen(false);
          }}
          resultCount={draftVisibleTileCount}
          draftGroupCounts={draftFacetGroupCounts}
          catalogFieldIds={catalogFieldIds}
          setIndex={catalogSetIndex}
          draftFormatId={phoneDraftFormatId}
          onDraftFormatChange={(formatId) => {
            setPhoneDraftFormatId(formatId);
            if (!formatId) {
              setPhoneDraft((prev) => clearBanStatusSelection(prev));
            }
          }}
        />
      ) : null}
    </PageContainer>
  );
}
