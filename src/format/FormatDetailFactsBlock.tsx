import { buildCardDetailSetSearchHref } from '../catalog/cardDetailSets.ts';
import { searchWithFormatPath, type FormatId } from './formatCatalog.ts';
import { InfoCard } from '../ui/InfoCard.tsx';
import type { FormatDetailFacts, FormatSourceLink } from './formatDetailFacts.ts';

/** Two cards per row on a phone. Desktop fits as many equal-height cards as the row allows. */
const FACTS_GRID_CLASS =
  'grid grid-cols-2 items-stretch gap-2 md:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]';

/** Ban list is the full first phone row, then one column on desktop. */
const BAN_LIST_CARD_CLASS = 'col-span-2 md:col-span-1';

function FormatFactCard({
  label,
  to,
  className,
  children,
}: {
  label: string;
  to: string;
  className?: string;
  children: string;
}) {
  return (
    <InfoCard label={label} to={to} className={className} singleLine>
      {children}
    </InfoCard>
  );
}

export function FormatDetailFactsBlock({
  facts,
  formatId,
}: {
  facts: FormatDetailFacts;
  formatId: FormatId;
}) {
  const { banList, cardPool, genesysDetail } = facts;
  const poolHref = searchWithFormatPath(formatId);
  const banListName = genesysDetail?.banListName ?? banList?.listName;

  return (
    <aside className="min-w-0 w-full" aria-label="Format details">
      <dl className={FACTS_GRID_CLASS}>
        {banListName ? (
          <FormatFactCard label="Ban list" to={poolHref} className={BAN_LIST_CARD_CLASS}>
            {banListName}
          </FormatFactCard>
        ) : null}
        {banList?.effectiveDate ? (
          <FormatFactCard label="Effective" to={poolHref}>
            {banList.effectiveDate}
          </FormatFactCard>
        ) : null}
        {cardPool ? (
          <FormatFactCard label="Cards released by" to={poolHref}>
            {cardPool.cardsReleasedBy}
          </FormatFactCard>
        ) : null}
        {cardPool ? (
          <FormatFactCard
            label="Latest set"
            to={
              cardPool.latestSetQuery
                ? buildCardDetailSetSearchHref(cardPool.latestSetQuery)
                : poolHref
            }
          >
            {cardPool.latestSet}
          </FormatFactCard>
        ) : null}
        {cardPool?.notIncluded ? (
          <FormatFactCard
            label="Not included"
            to={
              cardPool.notIncludedQuery
                ? buildCardDetailSetSearchHref(cardPool.notIncludedQuery)
                : poolHref
            }
          >
            {cardPool.notIncluded}
          </FormatFactCard>
        ) : null}
        {genesysDetail ? (
          <FormatFactCard label="Point cap" to={poolHref}>
            {String(genesysDetail.pointCap)}
          </FormatFactCard>
        ) : null}
        {genesysDetail ? (
          <FormatFactCard label="Not included" to={poolHref}>
            {genesysDetail.notIncluded}
          </FormatFactCard>
        ) : null}
      </dl>
    </aside>
  );
}

export function FormatDetailSourcesFooter({ links }: { links: readonly FormatSourceLink[] }) {
  if (links.length === 0) return null;

  return (
    <footer role="contentinfo" className="text-xs text-text-2">
      <span>Sources: </span>
      {links.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? <span aria-hidden="true"> · </span> : null}
          <a
            href={link.href}
            className="text-text-2 underline-offset-2 hover:text-heading hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
            rel="noopener noreferrer"
            target="_blank"
          >
            {link.label}
          </a>
        </span>
      ))}
    </footer>
  );
}
