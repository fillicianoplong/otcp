import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { buildSearchIndex } from '../search/index.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { buildFilterEngine, emptyFilterState, type FilterState } from './filterEngine.ts';
import { filterStateSignature } from './filterUrlState.ts';
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
import { formatCardCount } from './formatCardCount.ts';
import { useCardCatalog } from './useCardCatalog.ts';

function CardArt({ card }: { card: YugiohCard }) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <div className="flex aspect-[59/86] w-full flex-col items-center justify-center gap-1 rounded-sm bg-surface-2 px-2 text-center text-xs text-text-2">
        <span>No image</span>
        <span className="font-medium text-heading">{card.name}</span>
      </div>
    );
  }

  return (
    <img
      src={card.images.small}
      alt={card.name}
      loading="lazy"
      decoding="async"
      onError={() => setMissing(true)}
      className="aspect-[59/86] w-full object-cover"
    />
  );
}

function CardTile({
  card,
  searchQuery,
  onBeforeNavigate,
}: {
  card: YugiohCard;
  searchQuery: string;
  onBeforeNavigate: () => void;
}) {
  const detailPath =
    searchQuery.length > 0
      ? `/search/card/${card.id}?q=${encodeURIComponent(searchQuery)}`
      : `/search/card/${card.id}`;

  return (
    <li>
      <Link
        to={detailPath}
        state={{ fromSearch: true }}
        onClick={onBeforeNavigate}
        aria-label={card.name}
        className="block rounded-sm transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
      >
        <CardArt card={card} />
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

function CardCatalogGrid({
  visibleCards,
  matchCount,
  searchQuery,
  initialVisibleCount,
  restoreScrollY,
  onBeforeNavigate,
}: {
  visibleCards: YugiohCard[];
  matchCount: number;
  searchQuery: string;
  initialVisibleCount?: number;
  restoreScrollY?: number | null;
  onBeforeNavigate: (loadedCount: number) => void;
}) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(() => {
    if (initialVisibleCount !== undefined) {
      return Math.min(Math.max(0, initialVisibleCount), matchCount);
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

  const renderedCards = sliceGridCards(visibleCards, visibleCount);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {renderedCards.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            searchQuery={searchQuery}
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
}: {
  headingId?: string;
  searchQuery?: string;
  filterState?: FilterState;
  showResultCount?: boolean;
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

  const searchIndex = useMemo(() => {
    if (state.status !== 'ready') return null;
    return buildSearchIndex(state.cards);
  }, [state]);

  const filterEngine = useMemo(() => {
    if (state.status !== 'ready') return null;
    return buildFilterEngine(state.cards);
  }, [state]);

  const { visibleCards, matchCount } = useMemo(() => {
    if (state.status !== 'ready') {
      return { visibleCards: [] as YugiohCard[], matchCount: 0 };
    }
    let searchIds: number[] | undefined;
    if (trimmedQuery && searchIndex) {
      searchIds = searchIndex.query(trimmedQuery).ids;
    }
    const filtered = filterEngine
      ? filterEngine.apply(filterState, searchIds ? { searchIds } : {})
      : { ids: state.cards.map((c) => c.id), count: state.cards.length };
    const byId = new Map(state.cards.map((card) => [card.id, card]));
    const visibleCards = filtered.ids
      .map((id) => byId.get(id))
      .filter((card): card is YugiohCard => card !== undefined);
    return { visibleCards, matchCount: filtered.count };
  }, [filterEngine, filterState, searchIndex, state, trimmedQuery]);

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
          {formatCardCount(matchCount)}
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
      ) : (
        <CardCatalogGrid
          key={`${trimmedQuery}:${filtersKey}:${matchCount}`}
          visibleCards={visibleCards}
          matchCount={matchCount}
          searchQuery={trimmedQuery}
          initialVisibleCount={scrollRestore?.loadedCount}
          restoreScrollY={scrollRestore?.scrollY ?? null}
          onBeforeNavigate={persistScrollRestore}
        />
      )}
    </section>
  );
}
