import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import type { YugiohCard } from '../shared/schema/card.ts';
import { ColumnHeader } from '../ui/ColumnHeader.tsx';
import { orderedVisibleTableColumns, type TableColumn } from '../ui/tableColumns.ts';
import {
  banMarkerForStatus,
  isFormatBanContextActive,
  resolveCardBanForFormat,
} from './formatBanContext.ts';
import { buildSearchCardDetailPath } from './searchCardLinks.ts';
import { cardDetailLinkStateFromSearch, type CardDetailLinkState } from './searchNavigation.ts';
import {
  catalogTableArchetypeCell,
  catalogTableAtkCell,
  catalogTableAttributeCell,
  catalogTableCardTypeCell,
  catalogTableDefCell,
  catalogTableLevelCell,
  catalogTablePriceCell,
  catalogTableRaceOrPropertyCell,
  catalogTableVisibilityFromRecord,
  CATALOG_TABLE_NAME_COLUMN,
  CATALOG_TABLE_BAN_COLUMN,
  CATALOG_TABLE_OPTIONAL_COLUMN_DEFS,
  CATALOG_TABLE_OPTIONAL_COLUMN_IDS,
  CATALOG_TABLE_SORTABLE_COLUMN_DEFS,
  type CatalogTableColumnVisibility,
  type CatalogTableOptionalColumnId,
  type CatalogTableSortColumnId,
} from './catalogTableColumns.ts';
import { type CatalogTableSortState } from './catalogTableSort.ts';
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
      <div className="flex aspect-card w-8 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-2xs text-text-2">
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
      className="aspect-card w-8 shrink-0 rounded-sm object-cover bg-surface-2"
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

const CATALOG_SORT_COLUMN_IDS = new Set<string>(
  CATALOG_TABLE_SORTABLE_COLUMN_DEFS.map((column) => column.id),
);

function isCatalogSortColumn(id: string): id is CatalogTableSortColumnId {
  return CATALOG_SORT_COLUMN_IDS.has(id);
}

function isOptionalColumn(id: string): id is CatalogTableOptionalColumnId {
  return (CATALOG_TABLE_OPTIONAL_COLUMN_IDS as readonly string[]).includes(id);
}

function buildCatalogHeaderColumns(showBan: boolean): TableColumn[] {
  return [
    {
      id: CATALOG_TABLE_NAME_COLUMN.id,
      label: CATALOG_TABLE_NAME_COLUMN.label,
      locked: true,
      sortable: true,
    },
    ...CATALOG_TABLE_OPTIONAL_COLUMN_DEFS.map((column) => ({
      id: column.id,
      label: column.label,
      defaultVisible: column.defaultVisible,
      sortable: true,
    })),
    ...(showBan
      ? [
          {
            id: CATALOG_TABLE_BAN_COLUMN.id,
            label: CATALOG_TABLE_BAN_COLUMN.label,
            locked: true,
            sortable: true,
          },
        ]
      : []),
  ];
}

export function CardCatalogTable({
  visibleCards,
  matchCount,
  searchQuery,
  formatParam,
  columnVisibility,
  columnOrder,
  sort,
  onSortChange,
  onColumnVisibilityChange,
  onColumnOrderChange,
  initialVisibleCount,
  restoreScrollY,
  onBeforeNavigate,
  linkState,
}: {
  visibleCards: YugiohCard[];
  matchCount: number;
  searchQuery: string;
  formatParam?: string | null;
  columnVisibility: CatalogTableColumnVisibility;
  columnOrder?: readonly string[] | null;
  sort: CatalogTableSortState;
  onSortChange: (next: CatalogTableSortState) => void;
  onColumnVisibilityChange?: (next: CatalogTableColumnVisibility) => void;
  onColumnOrderChange?: (next: readonly string[]) => void;
  initialVisibleCount?: number;
  restoreScrollY?: number | null;
  onBeforeNavigate: (loadedCount: number) => void;
  linkState?: CardDetailLinkState;
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
  const headerColumns = useMemo(() => buildCatalogHeaderColumns(showBanColumn), [showBanColumn]);
  const shown = orderedVisibleTableColumns(headerColumns, columnVisibility, columnOrder);

  const openDetail = (card: YugiohCard) => {
    onBeforeNavigate(visibleCount);
    const detailPath = buildSearchCardDetailPath(card.id, {
      searchQuery,
      formatParam,
    });
    navigate(detailPath, { state: linkState ?? cardDetailLinkStateFromSearch() });
  };

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-[1] border-b border-border bg-surface">
            <tr>
              {shown.map((column) => (
                <ColumnHeader
                  key={column.id}
                  column={column}
                  columns={headerColumns}
                  visibility={columnVisibility}
                  order={columnOrder}
                  onVisibilityChange={(next) =>
                    onColumnVisibilityChange?.(catalogTableVisibilityFromRecord(next))
                  }
                  onOrderChange={(next) => onColumnOrderChange?.(next)}
                  sort={{ columnId: sort.column, direction: sort.direction }}
                  onSortChange={(next) => {
                    if (!isCatalogSortColumn(next.columnId)) return;
                    onSortChange({ column: next.columnId, direction: next.direction });
                  }}
                  className={
                    column.id === 'name'
                      ? 'min-w-[12rem]'
                      : column.id === 'ban'
                        ? 'min-w-[6rem]'
                        : undefined
                  }
                  labelClassName="text-xs font-semibold"
                />
              ))}
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
                {shown.map((column) => {
                  if (column.id === 'name') {
                    return (
                      <td key={column.id} className="max-w-[16rem] px-2 py-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <TableRowThumbnail card={card} />
                          <span className="truncate font-medium text-heading">{card.name}</span>
                        </div>
                      </td>
                    );
                  }
                  if (column.id === 'ban') {
                    return (
                      <td key={column.id} className="px-2 py-1.5">
                        <TableBanCell card={card} formatParam={formatParam} />
                      </td>
                    );
                  }
                  if (!isOptionalColumn(column.id)) return null;
                  return (
                    <td
                      key={column.id}
                      className={`whitespace-nowrap px-2 py-1.5 text-text-2 ${
                        column.id === 'atk' ||
                        column.id === 'def' ||
                        column.id === 'level' ||
                        column.id === 'price'
                          ? 'tabular-nums'
                          : ''
                      }`}
                    >
                      {cellForOptionalColumn(column.id, card)}
                    </td>
                  );
                })}
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
