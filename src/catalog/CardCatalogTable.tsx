import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import type { YugiohCard } from '../shared/schema/card.ts';
import {
  banMarkerForStatus,
  isFormatBanContextActive,
  resolveCardBanForFormat,
} from './formatBanContext.ts';
import {
  catalogTableArchetypeCell,
  catalogTableAtkCell,
  catalogTableAttributeCell,
  catalogTableCardTypeCell,
  catalogTableDefCell,
  catalogTableLevelCell,
  catalogTablePriceCell,
  catalogTableRaceOrPropertyCell,
  catalogTableColumnLabel,
  CATALOG_TABLE_NAME_COLUMN,
  CATALOG_TABLE_BAN_COLUMN,
  CATALOG_TABLE_OPTIONAL_COLUMN_IDS,
  type CatalogTableColumnVisibility,
  type CatalogTableOptionalColumnId,
  type CatalogTableSortColumnId,
} from './catalogTableColumns.ts';
import { type CatalogTableSortState, toggleCatalogTableSort } from './catalogTableSort.ts';
import {
  gridHasMore,
  initialGridVisibleCount,
  nextGridVisibleCount,
  sliceGridCards,
} from './gridPaging.ts';

function TableRowThumbnail({ card }: { card: YugiohCard }) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <div className="flex aspect-[59/86] w-8 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-[9px] text-text-2">
        —
      </div>
    );
  }

  return (
    <img
      src={card.images.small}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setMissing(true)}
      className="aspect-[59/86] w-8 shrink-0 rounded-sm object-cover bg-surface-2"
    />
  );
}

function TableBanCell({
  card,
  formatParam,
}: {
  card: YugiohCard;
  formatParam: string | null | undefined;
}) {
  if (!isFormatBanContextActive(formatParam)) {
    return <span className="text-text-2">—</span>;
  }

  const status = resolveCardBanForFormat(card, formatParam);
  if (!status) {
    return <span className="text-text-2">—</span>;
  }

  const { glyph, label, colorClass } = banMarkerForStatus(status);
  return (
    <span
      className={`text-base font-bold leading-none ${colorClass}`}
      title={label}
      aria-label={label}
    >
      {glyph}
    </span>
  );
}

function SortIndicator({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) {
    return (
      <span aria-hidden className="ml-1 text-text-2 opacity-60">
        ↕
      </span>
    );
  }
  return (
    <span aria-hidden className="ml-1 text-heading">
      {direction === 'asc' ? '↑' : '↓'}
    </span>
  );
}

function cellForOptionalColumn(columnId: CatalogTableOptionalColumnId, card: YugiohCard): string {
  switch (columnId) {
    case 'cardType':
      return catalogTableCardTypeCell(card);
    case 'attribute':
      return catalogTableAttributeCell(card);
    case 'type':
      return catalogTableRaceOrPropertyCell(card);
    case 'level':
      return catalogTableLevelCell(card);
    case 'atk':
      return catalogTableAtkCell(card);
    case 'def':
      return catalogTableDefCell(card);
    case 'archetype':
      return catalogTableArchetypeCell(card);
    case 'price':
      return catalogTablePriceCell(card);
    default:
      return '—';
  }
}

function sortHeaderAriaLabel(label: string, active: boolean, direction: 'asc' | 'desc'): string {
  if (!active) return `Sort by ${label}`;
  return `${label}, sorted ${direction === 'asc' ? 'ascending' : 'descending'}`;
}

function SortableHeader({
  columnId,
  label,
  sort,
  onSort,
  className = '',
}: {
  columnId: CatalogTableSortColumnId;
  label: string;
  sort: CatalogTableSortState;
  onSort: (column: CatalogTableSortColumnId) => void;
  className?: string;
}) {
  const active = sort.column === columnId;
  const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <th scope="col" aria-sort={ariaSort} aria-label={label} className={className}>
      <button
        type="button"
        onClick={() => onSort(columnId)}
        aria-label={sortHeaderAriaLabel(label, active, sort.direction)}
        className="inline-flex min-h-9 w-full items-center px-2 text-left text-xs font-semibold text-text-2 hover:text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong"
      >
        {label}
        <SortIndicator active={active} direction={sort.direction} />
      </button>
    </th>
  );
}

export function CardCatalogTable({
  visibleCards,
  matchCount,
  searchQuery,
  formatParam,
  columnVisibility,
  sort,
  onSortChange,
  initialVisibleCount,
  restoreScrollY,
  onBeforeNavigate,
}: {
  visibleCards: YugiohCard[];
  matchCount: number;
  searchQuery: string;
  formatParam?: string | null;
  columnVisibility: CatalogTableColumnVisibility;
  sort: CatalogTableSortState;
  onSortChange: (next: CatalogTableSortState) => void;
  initialVisibleCount?: number;
  restoreScrollY?: number | null;
  onBeforeNavigate: (loadedCount: number) => void;
}) {
  const navigate = useNavigate();
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

  const renderedCards = sliceGridCards(visibleCards, visibleCount);
  const showBanColumn = isFormatBanContextActive(formatParam);
  const visibleOptionalColumns = CATALOG_TABLE_OPTIONAL_COLUMN_IDS.filter(
    (columnId) => columnVisibility[columnId],
  );

  const handleSort = (column: CatalogTableSortColumnId) => {
    onSortChange(toggleCatalogTableSort(sort, column));
  };

  const openDetail = (card: YugiohCard) => {
    onBeforeNavigate(visibleCount);
    const detailPath =
      searchQuery.length > 0
        ? `/search/card/${card.id}?q=${encodeURIComponent(searchQuery)}`
        : `/search/card/${card.id}`;
    navigate(detailPath, { state: { fromSearch: true } });
  };

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-[1] border-b border-border bg-surface">
            <tr>
              <SortableHeader
                columnId={CATALOG_TABLE_NAME_COLUMN.id}
                label={CATALOG_TABLE_NAME_COLUMN.label}
                sort={sort}
                onSort={handleSort}
                className="min-w-[12rem]"
              />
              {visibleOptionalColumns.map((columnId) => (
                <SortableHeader
                  key={columnId}
                  columnId={columnId}
                  label={catalogTableColumnLabel(columnId)}
                  sort={sort}
                  onSort={handleSort}
                  className="whitespace-nowrap"
                />
              ))}
              {showBanColumn ? (
                <SortableHeader
                  columnId={CATALOG_TABLE_BAN_COLUMN.id}
                  label={CATALOG_TABLE_BAN_COLUMN.label}
                  sort={sort}
                  onSort={handleSort}
                  className="w-14"
                />
              ) : null}
            </tr>
          </thead>
          <tbody>
            {renderedCards.map((card) => (
              <tr
                key={card.id}
                tabIndex={0}
                onClick={() => openDetail(card)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openDetail(card);
                  }
                }}
                className="cursor-pointer border-b border-border last:border-b-0 hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong"
              >
                <td className="max-w-[16rem] px-2 py-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <TableRowThumbnail card={card} />
                    <span className="truncate font-medium text-heading">{card.name}</span>
                  </div>
                </td>
                {visibleOptionalColumns.map((columnId) => (
                  <td
                    key={columnId}
                    className={`whitespace-nowrap px-2 py-1.5 text-text-2 ${
                      columnId === 'atk' ||
                      columnId === 'def' ||
                      columnId === 'level' ||
                      columnId === 'price'
                        ? 'tabular-nums'
                        : ''
                    }`}
                  >
                    {cellForOptionalColumn(columnId, card)}
                  </td>
                ))}
                {showBanColumn ? (
                  <td className="px-2 py-1.5">
                    <TableBanCell card={card} formatParam={formatParam} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {gridHasMore(visibleCount, matchCount) ? (
        <div ref={loadMoreRef} className="h-8" aria-hidden />
      ) : null}
    </>
  );
}
