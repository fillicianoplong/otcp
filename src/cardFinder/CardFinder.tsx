import { useMemo, useState, type ReactNode } from 'react';

import { FacetFilterPanel, PhoneFiltersSheet } from '../catalog/FacetFilterPanel.tsx';
import { FilterChips } from '../catalog/FilterChips.tsx';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import { getCatalogDerived } from '../catalog/catalogDerived.ts';
import { queryCatalog } from '../catalog/catalogQueryCache.ts';
import {
  emptyFilterState,
  resolveFilterStateUpdater,
  type FilterState,
  type FilterStateUpdater,
} from '../catalog/filterEngine.ts';
import { countActiveFacetSelections, filterStateToChips } from '../catalog/filterUrlState.ts';
import type { DeckAddTarget } from '../deckEditor/deckPlacement.ts';
import { writeDraggedCardId } from '../deckEditor/deckPlacement.ts';
import type { FormatId } from '../format/formatCatalog.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { CardFinderViewToggle } from './CardFinderViewToggle.tsx';
import {
  CARD_FINDER_GRID_CLASS,
  readCardFinderViewMode,
  writeCardFinderViewMode,
  type CardFinderViewMode,
} from './cardFinderView.ts';
import { EditorCardRow } from './EditorCardRow.tsx';
import { EditorCardTile } from './EditorCardTile.tsx';

const RESULT_PAGE_SIZE = 40;

const fieldClassName =
  'min-h-[var(--touch-min)] w-full rounded-md border border-border bg-bg px-3 text-sm text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

const quietButtonClassName =
  'inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

const ADD_TARGET_OPTIONS: readonly { value: DeckAddTarget; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'main', label: 'Main' },
  { value: 'extra', label: 'Extra' },
  { value: 'side', label: 'Side' },
];

export function CardFinder({
  formatId,
  setIndex,
  query,
  onQueryChange,
  filterState,
  onFilterStateChange,
  addTarget,
  onAddTargetChange,
  quantityForCard,
  onAdd,
  onRemove,
  dragEnabled,
  onCardDragStart,
  filtersInSheet,
  onFiltersVisibilityChange,
  autoFocusSearch = false,
}: {
  formatId: FormatId;
  setIndex?: SetIndex | null;
  query: string;
  onQueryChange: (query: string) => void;
  filterState: FilterState;
  onFilterStateChange: (next: FilterState) => void;
  addTarget: DeckAddTarget;
  onAddTargetChange: (target: DeckAddTarget) => void;
  quantityForCard: (cardId: number) => number;
  onAdd: (card: YugiohCard) => void;
  onRemove: (card: YugiohCard) => void;
  dragEnabled: boolean;
  onCardDragStart?: (cardId: number) => void;
  filtersInSheet: boolean;
  onFiltersVisibilityChange?: (open: boolean) => void;
  autoFocusSearch?: boolean;
}) {
  const { state: catalogState } = useCardCatalog();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState<FilterState>(filterState);
  const [visibleLimit, setVisibleLimit] = useState(RESULT_PAGE_SIZE);
  const [viewMode, setViewMode] = useState<CardFinderViewMode>(() => readCardFinderViewMode());

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
      formatParam: formatId,
      setIndex,
    });
  }, [catalogDerived, filtersInSheet, formatId, phoneDraft, setIndex, trimmedQuery]);

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
  const chips = useMemo(() => filterStateToChips(filterState), [filterState]);
  const activeFilters = countActiveFacetSelections(filterState);

  const commitFilters = (updater: FilterStateUpdater) => {
    onFilterStateChange(resolveFilterStateUpdater(updater, filterState));
  };

  const setFiltersVisible = (open: boolean) => {
    setFiltersOpen(open);
    onFiltersVisibilityChange?.(open);
    if (open && filtersInSheet) {
      setPhoneDraft(filterState);
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
    body = (
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-text-2">No cards match.</p>
        {viewToggle}
      </div>
    );
  } else {
    const ResultCard = viewMode === 'grid' ? EditorCardTile : EditorCardRow;
    body = (
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-text-2">
            {orderedCards.length > visibleCards.length
              ? `Showing ${visibleCards.length} of ${orderedCards.length}`
              : `${orderedCards.length} ${orderedCards.length === 1 ? 'card' : 'cards'}`}
          </p>
          {viewToggle}
        </div>
        <ul
          className={viewMode === 'grid' ? CARD_FINDER_GRID_CLASS : 'flex flex-col gap-2'}
          data-testid="card-finder-results"
          data-view={viewMode}
        >
          {visibleCards.map((card) => (
            <ResultCard
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
        {orderedCards.length > visibleCards.length ? (
          <button
            type="button"
            className={quietButtonClassName}
            onClick={() => setVisibleLimit((current) => current + RESULT_PAGE_SIZE)}
          >
            Show more
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-text">
        <span>Search cards</span>
        <input
          type="search"
          value={query}
          autoFocus={autoFocusSearch}
          placeholder="Name or passcode"
          onChange={(event) => onQueryChange(event.target.value)}
          className={fieldClassName}
        />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={quietButtonClassName}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersVisible(!filtersOpen)}
          >
            {activeFilters > 0 ? `Filters (${activeFilters})` : 'Filters'}
          </button>
          {activeFilters > 0 ? (
            <button
              type="button"
              className="text-sm text-text underline decoration-border underline-offset-2 hover:text-heading"
              onClick={() => onFilterStateChange(emptyFilterState())}
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <FilterChips chips={chips} onChange={commitFilters} />
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm text-text" id="card-finder-add-target">
          Add to
        </span>
        <div
          className="inline-flex max-w-full overflow-hidden rounded-md border border-border"
          role="radiogroup"
          aria-labelledby="card-finder-add-target"
        >
          {ADD_TARGET_OPTIONS.map((option, index) => {
            const selected = addTarget === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`inline-flex min-h-8 items-center justify-center px-2.5 text-sm focus-visible:z-[1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong ${
                  index > 0 ? '-ml-px border-l' : ''
                } ${
                  selected
                    ? 'relative z-[1] border-border-strong bg-accent text-on-accent'
                    : 'border-border bg-surface text-heading hover:bg-surface-2'
                }`}
                onClick={() => onAddTargetChange(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtersOpen && !filtersInSheet && catalogDerived ? (
        <div className="max-h-72 overflow-y-auto rounded-md border border-border p-2">
          <FacetFilterPanel
            filterState={filterState}
            groupCounts={queryResult?.facetGroupCounts ?? []}
            catalogFieldIds={catalogFieldIds}
            onChange={commitFilters}
            setIndex={setIndex}
            activeFormatId={formatId}
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
            setFiltersVisible(false);
          }}
          onReset={() => setPhoneDraft(emptyFilterState())}
          resultCount={phoneDraftResult?.matchCount ?? 0}
          draftGroupCounts={phoneDraftResult?.facetGroupCounts ?? []}
          catalogFieldIds={catalogFieldIds}
          setIndex={setIndex}
          draftFormatId={formatId}
        />
      ) : null}
    </div>
  );
}
