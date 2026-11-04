import { Link } from 'react-router';

import { BanThumbMarker } from '../catalog/BanThumbMarker.tsx';
import { CardListRow } from '../catalog/CardListRow.tsx';
import { CatalogGridTileFrame, CatalogGridTileImage } from '../catalog/CatalogGridTileArt.tsx';
import { CATALOG_GRID_CLASS } from '../catalog/catalogGridLayout.ts';
import { buildSearchCardDetailPath } from '../catalog/searchCardLinks.ts';
import { formatCardCount } from '../catalog/formatCardCount.ts';
import type { FormatId } from './formatCatalog.ts';
import { BanlistChangeBadgeMarker } from './BanlistChangeBadgeMarker.tsx';
import type { FormatBanlistCardEntry, FormatBanlistSection } from './formatBanlistPageModel.ts';

export function BanlistGridTile({
  entry,
  formatParam,
}: {
  entry: FormatBanlistCardEntry;
  formatParam?: FormatId;
}) {
  const { card, banStatus, changeBadge } = entry;
  return (
    <li>
      <Link
        to={buildSearchCardDetailPath(card.id, formatParam ? { formatParam } : undefined)}
        aria-label={card.name}
        className="block rounded-sm transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
      >
        <CatalogGridTileFrame>
          <CatalogGridTileImage card={card} alt="" />
          {banStatus ? <BanThumbMarker status={banStatus} /> : null}
          {changeBadge ? <BanlistChangeBadgeMarker badge={changeBadge} /> : null}
        </CatalogGridTileFrame>
      </Link>
    </li>
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
    <section
      aria-labelledby={`${headingIdPrefix}-${section.id}`}
      className="flex flex-col gap-3 overflow-x-hidden rounded-md border border-border bg-surface p-3"
    >
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h2
          id={`${headingIdPrefix}-${section.id}`}
          className="text-base font-semibold text-heading"
        >
          {section.heading}
        </h2>
        <span className="text-xs text-text-2">{formatCardCount(section.cards.length)}</span>
      </div>
      <ul className={CATALOG_GRID_CLASS}>
        {section.cards.map((entry) => (
          <BanlistGridTile key={entry.card.id} entry={entry} formatParam={formatParam} />
        ))}
      </ul>
    </section>
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

  return (
    <section
      aria-labelledby={`${headingIdPrefix}-${section.id}`}
      className="overflow-hidden rounded-md border border-border bg-surface"
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-border px-3 py-2">
        <h2
          id={`${headingIdPrefix}-${section.id}`}
          className="text-base font-semibold text-heading"
        >
          {section.heading}
        </h2>
        <span className="text-xs text-text-2">{formatCardCount(section.cards.length)}</span>
      </div>
      <ul className="divide-y divide-border">
        {section.cards.map((entry) => (
          <CardListRow
            key={entry.card.id}
            card={entry.card}
            searchQuery=""
            formatParam={formatParam}
            detailPath={buildSearchCardDetailPath(
              entry.card.id,
              formatParam ? { formatParam } : undefined,
            )}
          />
        ))}
      </ul>
    </section>
  );
}
