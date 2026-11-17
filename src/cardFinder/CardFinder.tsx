import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { FacetFilterPanel, PhoneFiltersSheet } from '../catalog/FacetFilterPanel.tsx';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import { getCatalogDerived } from '../catalog/catalogDerived.ts';
import { queryCatalog } from '../catalog/catalogQueryCache.ts';
import {
  emptyFilterState,
  resolveFilterStateUpdater,
  type FilterState,
  type FilterStateUpdater,
} from '../catalog/filterEngine.ts';
import { countActiveFacetSelections } from '../catalog/filterUrlState.ts';
import { clearAllFilters } from '../catalog/filterSelection.ts';
import { DeckArtTile } from '../deckEditor/DeckArtTile.tsx';
import { LIBRARY_GRID_COLUMNS, libraryGridColumnCount } from './libraryGrid.ts';
import { writeDraggedCardId } from '../deckEditor/deckPlacement.ts';
import type { FormatId } from '../format/formatCatalog.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { Button } from '../ui/Button.tsx';
import { FiltersToolbarButton } from '../ui/FiltersToolbarButton.tsx';
import { CardGrid } from '../ui/CardGrid.tsx';
import { Input } from '../ui/Input.tsx';
import { Toolbar } from '../ui/Toolbar.tsx';
import { CardFinderViewToggle } from './CardFinderViewToggle.tsx';
import {
  readCardFinderViewMode,
  writeCardFinderViewMode,
  type CardFinderViewMode,
} from './cardFinderView.ts';
import { EditorCardRow } from './EditorCardRow.tsx';

const RESULT_PAGE_SIZE = 40;

export function CardFinder({
  formatId,
  setIndex,
  query,
  onQueryChange,
  filterState,
  onFilterStateChange,
  quantityForCard,
  onAdd,
  onRemove,
  dragEnabled,
  onCardDragStart,
  filtersInSheet,
  onFiltersVisibilityChange,
  onFormatChange,
  autoFocusSearch = false,
  dropActive = false,
  preferredColumns = LIBRARY_GRID_COLUMNS,
}: {
  formatId: FormatId;
  setIndex?: SetIndex | null;
  query: string;
  onQueryChange: (query: string) => void;
  filterState: FilterState;
  onFilterStateChange: (next: FilterState) => void;
  quantityForCard: (cardId: number) => number;
  onAdd: (card: YugiohCard) => void;
  onRemove: (card: YugiohCard) => void;
  dragEnabled: boolean;
  onCardDragStart?: (cardId: number) => void;
  filtersInSheet: boolean;
  onFiltersVisibilityChange?: (open: boolean) => void;
  onFormatChange: (formatId: FormatId) => void;
  autoFocusSearch?: boolean;
  dropActive?: boolean;
  preferredColumns?: number;
}) {
  const { state: catalogState } = useCardCatalog();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState<FilterState>(filterState);
  const [phoneDraftFormatId, setPhoneDraftFormatId] = useState<FormatId>(formatId);
  const [visibleLimit, setVisibleLimit] = useState(RESULT_PAGE_SIZE);
  const [viewMode, setViewMode] = useState<CardFinderViewMode>(() => readCardFinderViewMode());
  const [gridColumns, setGridColumns] = useState(preferredColumns);
  const resultsRef = useRef<HTMLUListElement>(null);

  const catalogDerived = useMemo(() => {
    if (catalogState.status !== 'ready') return null;
    return getCatalogDerived(catalogState.cards);
  }, [catalogState]);

  const catalogFieldIds = useMemo(() => {
    if (!catalogDerived) return [];
    return catalogDerived.filterEngine.fieldsWithCatalog();
  }, [catalogDerived]);

  const trimmedQuery = query.trim();

  const queryResult = useMemo(() => {
    if (!catalogDerived) return null;
    return queryCatalog(catalogDerived, {
      filterState,
      query: trimmedQuery,
      formatParam: formatId,
      setIndex,
    });
  }, [catalogDerived, filterState, formatId, setIndex, trimmedQuery]);

  const phoneDraftResult = useMemo(() => {
    if (!catalogDerived || !filtersInSheet) return null;
    return queryCatalog(catalogDerived, {
      filterState: phoneDraft,
      query: trimmedQuery,
      formatParam: phoneDraftFormatId,
      setIndex,
    });
  }, [catalogDerived, filtersInSheet, phoneDraft, phoneDraftFormatId, setIndex, trimmedQuery]);

  const orderedCards = useMemo(() => {
    if (!catalogDerived || !queryResult) return [];
    const cards = queryResult.visibleCards;
    if (!trimmedQuery) return cards;
    const rank = new Map(
      catalogDerived.searchIndex.query(trimmedQuery).ids.map((id, index) => [id, index]),
    );
    return [...cards].sort((left, right) => (rank.get(left.id) ?? 0) - (rank.get(right.id) ?? 0));
  }, [catalogDerived, queryResult, trimmedQuery]);

  const visibleCards = orderedCards.slice(0, visibleLimit);

  useLayoutEffect(() => {
    const el = resultsRef.current;
    if (!el || viewMode !== 'grid') return undefined;
    const measure = () => {
      const next = libraryGridColumnCount(el.clientWidth, preferredColumns);
      setGridColumns((current) => (current === next ? current : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [preferredColumns, viewMode, visibleCards.length]);

  const activeFilters = countActiveFacetSelections(filterState);
  const filterCount = activeFilters + 1;

  const commitFilters = (updater: FilterStateUpdater) => {
    onFilterStateChange(resolveFilterStateUpdater(updater, filterState));
  };

  const setFiltersVisible = (open: boolean) => {
    setFiltersOpen(open);
    onFiltersVisibilityChange?.(open);
    if (open && filtersInSheet) {
      setPhoneDraft(filterState);
      setPhoneDraftFormatId(formatId);
    }
  };

  const chooseView = (mode: CardFinderViewMode) => {
    setViewMode(mode);
    writeCardFinderViewMode(mode);
  };

  const viewToggle = <CardFinderViewToggle value={viewMode} onChange={chooseView} />;

  let body: ReactNode;
  if (catalogState.status === 'loading') {
    body = (
      <p className="text-sm text-text" role="status">
        Catalog is still loading.
      </p>
    );
  } else if (catalogState.status === 'error') {
    body = (
      <p className="text-sm text-heading" role="alert">
        {catalogState.message}
      </p>
    );
  } else if (catalogState.status === 'empty') {
    body = <p className="text-sm text-text-2">No cards in the catalog.</p>;
  } else if (orderedCards.length === 0) {
    body = <p className="text-sm text-text-2">No cards match.</p>;
  } else {
    body = (
      <div className="flex min-h-0 flex-col gap-2">
        {viewMode === 'grid' ? (
          <CardGrid
            ref={resultsRef}
            variant="library"
            style={{
              gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
              gap: 'var(--tile-gap)',
            }}
            data-testid="card-finder-results"
            data-view={viewMode}
            data-columns={gridColumns}
          >
            {visibleCards.map((card) => (
              <li key={card.id} className="min-w-0">
                <DeckArtTile
                  card={card}
                  formatId={formatId}
                  payload={{ cardId: card.id, from: 'library' }}
                  label={`${card.name}. Press Enter to add it.`}
                  testId={`library-card-${card.id}`}
                  tileId={`library-${card.id}`}
                />
              </li>
            ))}
          </CardGrid>
        ) : (
          <ul
            ref={resultsRef}
            className="flex flex-col gap-2"
            data-testid="card-finder-results"
            data-view={viewMode}
          >
            {visibleCards.map((card) => (
              <EditorCardRow
                key={card.id}
                card={card}
                formatId={formatId}
                quantity={quantityForCard(card.id)}
                addLabel={`Add ${card.name}`}
                removeLabel={`Remove one ${card.name}`}
                onAdd={() => onAdd(card)}
                onRemove={() => onRemove(card)}
                draggable={dragEnabled}
                testId={`library-card-${card.id}`}
                onDragStart={(event) => {
                  writeDraggedCardId(event.dataTransfer, card.id);
                  onCardDragStart?.(card.id);
                }}
              />
            ))}
          </ul>
        )}
        {orderedCards.length > visibleCards.length ? (
          <Button onClick={() => setVisibleLimit((current) => current + RESULT_PAGE_SIZE)}>
            Show more
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      data-drop="library"
      className={`flex min-h-0 flex-col gap-3 rounded-md ${
        dropActive ? 'ring-2 ring-border-strong' : ''
      }`}
    >
      <label className="flex flex-col gap-1 text-sm text-text">
        <span>Search cards</span>
        <Input
          field="inset"
          type="search"
          value={query}
          autoFocus={autoFocusSearch}
          placeholder="Name or passcode"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <div className="flex flex-col gap-2">
        <Toolbar actions={viewToggle}>
          <FiltersToolbarButton
            count={filterCount}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersVisible(!filtersOpen)}
          />
        </Toolbar>
        {orderedCards.length > 0 ? (
          <p className="text-xs text-text-2">
            {orderedCards.length > visibleCards.length
              ? `Showing ${visibleCards.length} of ${orderedCards.length}`
              : `${orderedCards.length} ${orderedCards.length === 1 ? 'card' : 'cards'}`}
          </p>
        ) : null}
      </div>

      {filtersOpen && !filtersInSheet && catalogDerived ? (
        <div className="flex flex-col gap-2 rounded-md border border-border p-2">
          <Button className="self-start" onClick={() => commitFilters(clearAllFilters())}>
            Clear all
          </Button>
          <FacetFilterPanel
            filterState={filterState}
            groupCounts={queryResult?.facetGroupCounts ?? []}
            catalogFieldIds={catalogFieldIds}
            onChange={commitFilters}
            setIndex={setIndex}
            activeFormatId={formatId}
            onFormatChange={(nextFormatId) => {
              if (nextFormatId) onFormatChange(nextFormatId);
            }}
            formatAllowEmpty={false}
          />
        </div>
      ) : null}

      {body}

      {filtersInSheet ? (
        <PhoneFiltersSheet
          open={filtersOpen}
          onClose={() => setFiltersVisible(false)}
          draftState={phoneDraft}
          onDraftChange={(next) =>
            setPhoneDraft((previous) => resolveFilterStateUpdater(next, previous))
          }
          onApply={() => {
            onFilterStateChange(phoneDraft);
            if (phoneDraftFormatId !== formatId) onFormatChange(phoneDraftFormatId);
            setFiltersVisible(false);
          }}
          onReset={() => {
            setPhoneDraft(emptyFilterState());
            setPhoneDraftFormatId(formatId);
          }}
          resultCount={phoneDraftResult?.matchCount ?? 0}
          draftGroupCounts={phoneDraftResult?.facetGroupCounts ?? []}
          catalogFieldIds={catalogFieldIds}
          setIndex={setIndex}
          draftFormatId={phoneDraftFormatId}
          onDraftFormatChange={(nextFormatId) => {
            if (nextFormatId) setPhoneDraftFormatId(nextFormatId);
          }}
          formatAllowEmpty={false}
        />
      ) : null}
    </div>
  );
}
