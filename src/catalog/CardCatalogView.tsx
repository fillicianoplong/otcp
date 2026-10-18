import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { getCatalogDerived } from './catalogDerived.ts';
import { queryCatalog } from './catalogQueryCache.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { expandCardsToArtTiles, catalogResultCount, type CatalogArtTile } from './cardArt.ts';
import { useArtworkEnrichedCards } from './useArtworkEnrichedCards.ts';
import { emptyFilterState, type FilterState } from './filterEngine.ts';
import { filterStateSignature } from './filterUrlState.ts';
import { CATALOG_GRID_CLASS, CATALOG_GRID_TILE_ART_CLASS } from './catalogGridLayout.ts';
import { CatalogGridTileFrame } from './CatalogGridTileArt.tsx';
import {
  gridHasMore,
  initialGridVisibleCount,
  nextGridVisibleCount,
  sliceGridCards,
} from './gridPaging.ts';
import {
  mergeSearchScrollRestore,
  parseSearchScrollRestore,
  SEARCH_SCROLL_STATE_KEY,
  withoutSearchScrollRestore,
} from './searchScrollRestore.ts';
import { BanThumbMarker } from './BanThumbMarker.tsx';
import { CardCatalogTable } from './CardCatalogTable.tsx';
import { CardListRow } from './CardListRow.tsx';
import { type CatalogViewMode, effectiveCatalogViewMode } from './catalogViewMode.ts';
import {
  DEFAULT_CATALOG_TABLE_COLUMN_VISIBILITY,
  type CatalogTableColumnVisibility,
} from './catalogTableColumns.ts';
import { DEFAULT_CATALOG_TABLE_SORT, type CatalogTableSortState } from './catalogTableSort.ts';
import { buildSearchCardDetailPath } from './searchCardLinks.ts';
import { cardDetailLinkStateFromSearch } from './searchNavigation.ts';
import { resolveCardBanForFormat } from './formatBanContext.ts';
import { formatCatalogResultCount } from './formatCardCount.ts';
import { useCardCatalog } from './useCardCatalog.ts';
import { CatalogArtImage } from './CatalogArtImage.tsx';
import { catalogGridTileAriaLabel } from './catalogArtTileLabel.ts';

function CardArt({
  card,
  imageId,
  formatParam,
}: {
  card: YugiohCard;
  imageId: number;
  formatParam?: string | null;
}) {
  const banStatus = resolveCardBanForFormat(card, formatParam);

  return (
    <CatalogGridTileFrame>
      <CatalogArtImage
        card={card}
        imageId={imageId}
        size="small"
        alt=""
        loading="lazy"
        imgClassName={CATALOG_GRID_TILE_ART_CLASS}
      />
      {banStatus ? <BanThumbMarker status={banStatus} /> : null}
    </CatalogGridTileFrame>
  );
}

function CardTile({
  tile,
  searchQuery,
  formatParam,
  onBeforeNavigate,
}: {
  tile: CatalogArtTile;
  searchQuery: string;
  formatParam?: string | null;
  onBeforeNavigate: () => void;
}) {
  const { card, imageId } = tile;
  const detailPath = buildSearchCardDetailPath(card.id, {
    searchQuery,
    formatParam,
    artId: imageId,
  });

  return (
    <li>
      <Link
        to={detailPath}
        state={cardDetailLinkStateFromSearch()}
        onClick={onBeforeNavigate}
        aria-label={catalogGridTileAriaLabel(card, imageId)}
        className="block rounded-sm transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
      >
        <CardArt card={card} imageId={imageId} formatParam={formatParam} />
      </Link>
    </li>
  );
}

function CatalogMessage({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-6 text-text" role="status">
      <h2 className="text-base font-semibold text-heading">{title}</h2>
      <p className="mt-2 text-sm text-text-2">{children}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function CardCatalogList({
  visibleTiles,
  matchCount,
  searchQuery,
  formatParam,
  initialVisibleCount,
  restoreScrollY,
  onBeforeNavigate,
}: {
  visibleTiles: CatalogArtTile[];
  matchCount: number;
  searchQuery: string;
  formatParam?: string | null;
  initialVisibleCount?: number;
  restoreScrollY?: number | null;
  onBeforeNavigate: (loadedCount: number) => void;
}) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(() => {
    if (initialVisibleCount !== undefined && initialVisibleCount > 0) {
      return Math.min(initialVisibleCount, matchCount);
    }
    return initialGridVisibleCount(matchCount);
  });

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !gridHasMore(visibleCount, matchCount)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) => nextGridVisibleCount(current, matchCount));
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [matchCount, visibleCount]);

  useLayoutEffect(() => {
    if (restoreScrollY == null) return;
    window.scrollTo(0, restoreScrollY);
  }, [restoreScrollY, visibleCount]);

  const saveScrollState = () => {
    onBeforeNavigate(visibleCount);
  };

  const renderedTiles = sliceGridCards(visibleTiles, visibleCount);

  return (
    <>
      <ul className="flex flex-col gap-2">
        {renderedTiles.map((tile) => (
          <CardListRow
            key={`${tile.card.id}-${tile.imageId}`}
            card={tile.card}
            imageId={tile.imageId}
            searchQuery={searchQuery}
            formatParam={formatParam}
            onBeforeNavigate={saveScrollState}
          />
        ))}
      </ul>
      {gridHasMore(visibleCount, matchCount) ? (
        <div ref={loadMoreRef} className="h-8" aria-hidden />
      ) : null}
    </>
  );
}

function CardCatalogGrid({
  visibleTiles,
  matchCount,
  searchQuery,
  formatParam,
  initialVisibleCount,
  restoreScrollY,
  onBeforeNavigate,
}: {
  visibleTiles: CatalogArtTile[];
  matchCount: number;
  searchQuery: string;
  formatParam?: string | null;
  initialVisibleCount?: number;
  restoreScrollY?: number | null;
  onBeforeNavigate: (loadedCount: number) => void;
}) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(() => {
    if (initialVisibleCount !== undefined && initialVisibleCount > 0) {
      return Math.min(initialVisibleCount, matchCount);
    }
    return initialGridVisibleCount(matchCount);
  });

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !gridHasMore(visibleCount, matchCount)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) => nextGridVisibleCount(current, matchCount));
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [matchCount, visibleCount]);

  useLayoutEffect(() => {
    if (restoreScrollY == null) return;
    window.scrollTo(0, restoreScrollY);
  }, [restoreScrollY, visibleCount]);

  const saveScrollState = () => {
    onBeforeNavigate(visibleCount);
  };

  const renderedTiles = sliceGridCards(visibleTiles, visibleCount);

  return (
    <>
      <ul className={CATALOG_GRID_CLASS}>
        {renderedTiles.map((tile) => (
          <CardTile
            key={`${tile.card.id}-${tile.imageId}`}
            tile={tile}
            searchQuery={searchQuery}
            formatParam={formatParam}
            onBeforeNavigate={saveScrollState}
          />
        ))}
      </ul>
      {gridHasMore(visibleCount, matchCount) ? (
        <div ref={loadMoreRef} className="h-8" aria-hidden />
      ) : null}
    </>
  );
}

export function CardCatalogView({
  headingId,
  searchQuery = '',
  filterState = emptyFilterState(),
  showResultCount = true,
  viewMode = 'grid',
  formatParam = null,
  tableAvailable = true,
  tableColumnVisibility = DEFAULT_CATALOG_TABLE_COLUMN_VISIBILITY,
  tableSort = DEFAULT_CATALOG_TABLE_SORT,
  onTableSortChange,
  allArtworks = true,
}: {
  headingId?: string;
  searchQuery?: string;
  filterState?: FilterState;
  showResultCount?: boolean;
  viewMode?: CatalogViewMode;
  formatParam?: string | null;
  tableAvailable?: boolean;
  tableColumnVisibility?: CatalogTableColumnVisibility;
  tableSort?: CatalogTableSortState;
  onTableSortChange?: (next: CatalogTableSortState) => void;
  allArtworks?: boolean;
}) {
  const { state, retry } = useCardCatalog();
  const trimmedQuery = searchQuery.trim();
  const filtersKey = filterStateSignature(filterState);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  const scrollRestore = useMemo(
    () => parseSearchScrollRestore(location.state, trimmedQuery, filtersKey),
    [filtersKey, location.state, trimmedQuery],
  );

  useEffect(() => {
    if (scrollRestore) return;
    window.scrollTo(0, 0);
  }, [scrollRestore, trimmedQuery, filtersKey]);

  useEffect(() => {
    if (parseSearchScrollRestore(location.state, trimmedQuery, filtersKey)) return;
    if (typeof location.state !== 'object' || location.state === null) return;
    if (!(SEARCH_SCROLL_STATE_KEY in location.state)) return;
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: withoutSearchScrollRestore(location.state) },
    );
  }, [filtersKey, location, navigate, trimmedQuery]);

  const catalogDerived = useMemo(() => {
    if (state.status !== 'ready') return null;
    return getCatalogDerived(state.cards);
  }, [state]);

  const resolvedViewMode = effectiveCatalogViewMode(viewMode, { tableAvailable });

  const queryResult = useMemo(() => {
    if (!catalogDerived) {
      return { visibleCards: [] as YugiohCard[], matchCount: 0 };
    }
    const result = queryCatalog(catalogDerived, {
      filterState,
      query: trimmedQuery,
      formatParam: formatParam ?? null,
      setIndex: state.status === 'ready' ? state.setIndex : undefined,
      ...(resolvedViewMode === 'table' ? { tableSort } : {}),
    });
    return { visibleCards: result.visibleCards, matchCount: result.matchCount };
  }, [catalogDerived, filterState, formatParam, resolvedViewMode, state, tableSort, trimmedQuery]);

  const { visibleCards, matchCount } = queryResult;
  const enrichedVisibleCards = useArtworkEnrichedCards(visibleCards, allArtworks);
  const visibleTiles = useMemo(
    () => expandCardsToArtTiles(enrichedVisibleCards, allArtworks),
    [allArtworks, enrichedVisibleCards],
  );
  const displayCount = catalogResultCount(matchCount, visibleTiles, allArtworks);

  const tableCards = visibleCards;

  const handleTableSortChange = (next: CatalogTableSortState) => {
    onTableSortChange?.(next);
  };

  const persistScrollRestore = (loadedCount: number) => {
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      {
        replace: true,
        state: mergeSearchScrollRestore(location.state, {
          loadedCount,
          scrollY: window.scrollY,
          query: trimmedQuery,
          filtersKey,
        }),
      },
    );
  };

  if (state.status === 'loading') {
    return (
      <CatalogMessage title="Loading cards…">
        Fetching the published catalog index and card data.
      </CatalogMessage>
    );
  }

  if (state.status === 'empty') {
    return (
      <CatalogMessage title="No cards yet">
        The catalog index is missing or the published dataset has zero cards.
      </CatalogMessage>
    );
  }

  if (state.status === 'error') {
    return (
      <CatalogMessage
        title="Could not load cards"
        action={
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-[var(--touch-min)] items-center rounded-md border border-border-strong bg-accent px-4 text-sm font-medium text-on-accent hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
          >
            Retry
          </button>
        }
      >
        {state.message}
      </CatalogMessage>
    );
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      {showResultCount ? (
        <p className="text-sm text-text-2" aria-live="polite">
          {formatCatalogResultCount(displayCount, allArtworks)}
        </p>
      ) : null}
      {trimmedQuery && matchCount === 0 ? (
        <CatalogMessage title="No matching cards">
          Nothing in the catalog matched &ldquo;{trimmedQuery}&rdquo;. Try a shorter name or the
          full passcode.
        </CatalogMessage>
      ) : matchCount === 0 ? (
        <CatalogMessage title="No matching cards">
          No cards match the current filters. Try removing a filter or choose Clear all.
        </CatalogMessage>
      ) : resolvedViewMode === 'list' ? (
        <CardCatalogList
          key={`list:${trimmedQuery}:${filtersKey}:${displayCount}:${allArtworks}`}
          visibleTiles={visibleTiles}
          matchCount={displayCount}
          searchQuery={trimmedQuery}
          formatParam={formatParam}
          initialVisibleCount={scrollRestore?.loadedCount}
          restoreScrollY={scrollRestore?.scrollY ?? null}
          onBeforeNavigate={persistScrollRestore}
        />
      ) : resolvedViewMode === 'table' ? (
        <CardCatalogTable
          key={`table:${trimmedQuery}:${filtersKey}:${matchCount}:${tableSort.column}:${tableSort.direction}`}
          visibleCards={tableCards}
          matchCount={matchCount}
          searchQuery={trimmedQuery}
          formatParam={formatParam}
          columnVisibility={tableColumnVisibility}
          sort={tableSort}
          onSortChange={handleTableSortChange}
          initialVisibleCount={scrollRestore?.loadedCount}
          restoreScrollY={scrollRestore?.scrollY ?? null}
          onBeforeNavigate={persistScrollRestore}
        />
      ) : (
        <CardCatalogGrid
          key={`grid:${trimmedQuery}:${filtersKey}:${displayCount}:${allArtworks}`}
          visibleTiles={visibleTiles}
          matchCount={displayCount}
          searchQuery={trimmedQuery}
          formatParam={formatParam}
          initialVisibleCount={scrollRestore?.loadedCount}
          restoreScrollY={scrollRestore?.scrollY ?? null}
          onBeforeNavigate={persistScrollRestore}
        />
      )}
    </section>
  );
}
