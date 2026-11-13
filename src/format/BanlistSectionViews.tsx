import { useMemo } from 'react';
import { Link } from 'react-router';

import { BanThumbMarker } from '../catalog/BanThumbMarker.tsx';
import { CardCatalogTable } from '../catalog/CardCatalogTable.tsx';
import { CardListRow } from '../catalog/CardListRow.tsx';
import { CatalogGridTileImage } from '../catalog/CatalogGridTileArt.tsx';
import { sortCatalogTableRows } from '../catalog/catalogTableSort.ts';
import { CardGrid } from '../ui/CardGrid.tsx';
import { CardTile, CardTileFrame } from '../ui/CardTile.tsx';
import { CollapsibleSection } from '../ui/CollapsibleSection.tsx';
import { buildSearchCardDetailPath } from '../catalog/searchCardLinks.ts';
import {
  cardDetailLinkStateFromFormat,
  type CardDetailLinkState,
} from '../catalog/searchNavigation.ts';
import { formatCardCount } from '../catalog/formatCardCount.ts';
import {
  DEFAULT_CATALOG_TABLE_COLUMN_VISIBILITY,
  type CatalogTableColumnVisibility,
} from '../catalog/catalogTableColumns.ts';
import {
  DEFAULT_CATALOG_TABLE_SORT,
  type CatalogTableSortState,
} from '../catalog/catalogTableSort.ts';
import type { FormatId } from './formatCatalog.ts';
import { BanlistChangeBadgeMarker } from './BanlistChangeBadgeMarker.tsx';
import { isGenesysPlaceholderCardId } from './genesysPlaceholderCard.ts';
import type { FormatBanlistCardEntry, FormatBanlistSection } from './formatBanlistPageModel.ts';

function banlistEntryKey(entry: FormatBanlistCardEntry): string {
  return entry.genesysPoints != null
    ? `${entry.card.id}-${entry.genesysPoints}`
    : String(entry.card.id);
}

function FormatBanNameTile({ name }: { name: string }) {
  return (
    <div className="flex aspect-card w-full items-center justify-center rounded-sm border border-border bg-surface-2 p-1 text-center text-2xs leading-tight text-heading">
      {name}
    </div>
  );
}

function banlistLinkState(formatParam: FormatId | undefined): CardDetailLinkState | undefined {
  return formatParam ? cardDetailLinkStateFromFormat(formatParam) : undefined;
}

export function BanlistGridTile({
  entry,
  formatParam,
}: {
  entry: FormatBanlistCardEntry;
  formatParam?: FormatId;
}) {
  const { card, banStatus, changeBadge, genesysPoints } = entry;
  const placeholder = isGenesysPlaceholderCardId(card.id);
  const tile = (
    <CardTileFrame>
      {card.images.small ? (
        <CatalogGridTileImage card={card} alt="" />
      ) : (
        <FormatBanNameTile name={card.name} />
      )}
      {banStatus ? <BanThumbMarker status={banStatus} /> : null}
      {changeBadge ? <BanlistChangeBadgeMarker badge={changeBadge} /> : null}
      {genesysPoints != null ? (
        <span className="absolute bottom-0 left-0 right-0 bg-bg/90 px-1 py-0.5 text-center text-2xs font-medium leading-tight text-heading">
          {genesysPoints} pts
        </span>
      ) : null}
    </CardTileFrame>
  );

  if (placeholder) {
    return (
      <li aria-label={card.name} className="min-w-0">
        {tile}
      </li>
    );
  }

  return (
    <CardTile
      to={buildSearchCardDetailPath(card.id, formatParam ? { formatParam } : undefined)}
      state={banlistLinkState(formatParam)}
      label={card.name}
    >
      {tile}
    </CardTile>
  );
}

export function BanlistGridSection({
  section,
  formatParam,
  headingIdPrefix = 'ban-section',
}: {
  section: FormatBanlistSection;
  formatParam?: FormatId;
  headingIdPrefix?: string;
}) {
  if (section.cards.length === 0) return null;

  return (
    <CollapsibleSection
      title={section.heading}
      titleId={`${headingIdPrefix}-${section.id}`}
      count={formatCardCount(section.cards.length)}
      className="overflow-x-hidden"
    >
      <CardGrid variant="banlist">
        {section.cards.map((entry) => (
          <BanlistGridTile key={banlistEntryKey(entry)} entry={entry} formatParam={formatParam} />
        ))}
      </CardGrid>
    </CollapsibleSection>
  );
}

function BanlistGenesysListRow({
  entry,
  formatParam,
}: {
  entry: FormatBanlistCardEntry;
  formatParam?: FormatId;
}) {
  const placeholder = isGenesysPlaceholderCardId(entry.card.id);
  const rowBody = (
    <>
      <div className="relative w-9 shrink-0 overflow-hidden rounded-sm bg-surface-2">
        {entry.card.images.small ? (
          <img
            src={entry.card.images.small}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-card w-full object-cover"
          />
        ) : (
          <FormatBanNameTile name={entry.card.name} />
        )}
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-heading">{entry.card.name}</p>
      {entry.genesysPoints != null ? (
        <span className="shrink-0 text-sm text-heading">{entry.genesysPoints} pts</span>
      ) : null}
    </>
  );

  if (placeholder) {
    return (
      <li>
        <div className="flex items-center gap-3 px-2 py-2">{rowBody}</div>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={buildSearchCardDetailPath(entry.card.id, formatParam ? { formatParam } : undefined)}
        state={banlistLinkState(formatParam)}
        className="flex items-center gap-3 px-2 py-2 transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong"
      >
        {rowBody}
      </Link>
    </li>
  );
}

export function BanlistListSection({
  section,
  formatParam,
  headingIdPrefix = 'ban-list-section',
}: {
  section: FormatBanlistSection;
  formatParam?: FormatId;
  headingIdPrefix?: string;
}) {
  if (section.cards.length === 0) return null;

  const linkState = banlistLinkState(formatParam);

  return (
    <CollapsibleSection
      title={section.heading}
      titleId={`${headingIdPrefix}-${section.id}`}
      count={formatCardCount(section.cards.length)}
    >
      <ul className="flex flex-col gap-2">
        {section.cards.map((entry) =>
          entry.genesysPoints != null ? (
            <BanlistGenesysListRow
              key={banlistEntryKey(entry)}
              entry={entry}
              formatParam={formatParam}
            />
          ) : (
            <CardListRow
              key={banlistEntryKey(entry)}
              card={entry.card}
              searchQuery=""
              formatParam={formatParam}
              linkState={linkState}
              detailPath={buildSearchCardDetailPath(
                entry.card.id,
                formatParam ? { formatParam } : undefined,
              )}
            />
          ),
        )}
      </ul>
    </CollapsibleSection>
  );
}

export function BanlistTableSection({
  section,
  formatParam,
  headingIdPrefix = 'ban-table-section',
  columnVisibility = DEFAULT_CATALOG_TABLE_COLUMN_VISIBILITY,
  tableSort = DEFAULT_CATALOG_TABLE_SORT,
  onTableSortChange,
}: {
  section: FormatBanlistSection;
  formatParam?: FormatId;
  headingIdPrefix?: string;
  columnVisibility?: CatalogTableColumnVisibility;
  tableSort?: CatalogTableSortState;
  onTableSortChange?: (next: CatalogTableSortState) => void;
}) {
  const sortedCards = useMemo(
    () =>
      sortCatalogTableRows(
        section.cards.map((entry) => entry.card),
        tableSort,
        formatParam,
      ),
    [formatParam, section.cards, tableSort],
  );
  if (section.cards.length === 0) return null;

  const linkState = banlistLinkState(formatParam);

  return (
    <CollapsibleSection
      title={section.heading}
      titleId={`${headingIdPrefix}-${section.id}`}
      count={formatCardCount(section.cards.length)}
      className="overflow-x-hidden"
    >
      <CardCatalogTable
        visibleCards={sortedCards}
        matchCount={sortedCards.length}
        searchQuery=""
        formatParam={formatParam}
        columnVisibility={columnVisibility}
        sort={tableSort}
        onSortChange={onTableSortChange ?? (() => {})}
        onBeforeNavigate={() => {}}
        linkState={linkState}
      />
    </CollapsibleSection>
  );
}
