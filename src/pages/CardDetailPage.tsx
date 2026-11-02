import { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';

import { cardDetailImageFallback, cardDetailImageSrc } from '../catalog/cardArtUrl.ts';
import { buildCardDetailChips } from '../catalog/cardDetailChips.ts';
import { buildCardDetailDescriptionBlocks } from '../catalog/cardDetailDescriptions.ts';
import {
  CARD_DETAIL_MARKET_PRICE_ROWS,
  cardDetailMarketPriceDisplay,
  cardDetailMarketPriceValue,
} from '../catalog/cardDetailMarketPrices.ts';
import {
  buildCardDetailSetSearchHref,
  cardDetailSetRowSubtitle,
  cardDetailSetsExpandButtonLabel,
  cardDetailSetsHeadingCount,
  cardDetailSetsShowCollapseButton,
  cardDetailSetsVisibleCount,
  sortCardDetailSets,
} from '../catalog/cardDetailSets.ts';
import { getCatalogDerived } from '../catalog/catalogDerived.ts';
import {
  banMarkerForStatus,
  FORMAT_QUERY_KEY,
  isFormatBanContextActive,
  resolveCardBanForFormat,
} from '../catalog/formatBanContext.ts';
import { CardImageZoomViewer } from '../components/CardImageZoomViewer.tsx';
import { formatPriceSnapshotDate } from '../prices/formatPrice.ts';
import { buildStoreSearchUrl, STORE_LINK_LABELS } from '../prices/storeLinks.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import type { CardPrices } from '../shared/schema/core.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

function CardDetailArt({ card }: { card: YugiohCard }) {
  const [src, setSrc] = useState(() => cardDetailImageSrc(card));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [artMissing, setArtMissing] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openViewer = () => setViewerOpen(true);
  const closeViewer = () => setViewerOpen(false);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openViewer}
        className="block w-full cursor-zoom-in rounded-md p-0 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        aria-label={`View larger artwork for ${card.name}`}
      >
        <div className="relative mx-auto aspect-[63/88] w-full max-w-full overflow-hidden rounded-md border border-border bg-surface-2 md:max-w-[435px]">
          {artMissing ? (
            <span className="sr-only">Artwork unavailable for {card.name}</span>
          ) : (
            <img
              src={src}
              alt={card.name}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                const fallback = cardDetailImageFallback(card, src);
                if (fallback) {
                  setImageLoaded(false);
                  setSrc(fallback);
                } else {
                  setArtMissing(true);
                  setImageLoaded(false);
                }
              }}
              className={`pointer-events-none absolute inset-0 h-full w-full object-contain ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>
      </button>
      {viewerOpen ? (
        <CardImageZoomViewer
          src={src}
          alt={card.name}
          onClose={closeViewer}
          triggerRef={triggerRef}
        />
      ) : null}
    </>
  );
}

function CardDetailBanStatus({
  card,
  formatParam,
}: {
  card: YugiohCard;
  formatParam: string | null;
}) {
  if (!isFormatBanContextActive(formatParam)) return null;
  const status = resolveCardBanForFormat(card, formatParam);
  if (!status) return null;
  const { glyph, label, colorClass } = banMarkerForStatus(status);
  return (
    <span
      className={`text-lg font-bold leading-none ${colorClass}`}
      title={label}
      aria-label={label}
    >
      {glyph}
    </span>
  );
}

function CardDetailInfoChips({ card }: { card: YugiohCard }) {
  const chips = buildCardDetailChips(card);
  if (chips.length === 0) return null;

  return (
    <dl className="flex flex-wrap gap-2" aria-label="Card stats">
      {chips.map((chip) => (
        <div
          key={`${chip.label}-${chip.value}`}
          className="inline-flex min-w-0 max-w-full flex-col gap-0.5 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
        >
          <dt className="text-xs font-medium text-text-2">{chip.label}</dt>
          <dd className="font-medium text-heading">{chip.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const cardDetailLinkedRowClassName =
  'flex min-w-0 items-center justify-between gap-3 px-3 py-1.5 no-underline transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong';

function CardDetailMarketPrices({
  cardName,
  prices,
  snapshotAt,
}: {
  cardName: string;
  prices?: CardPrices;
  snapshotAt: string;
}) {
  return (
    <section className="flex flex-col gap-2" aria-labelledby="card-market-prices-heading">
      <h2 id="card-market-prices-heading" className="text-base font-semibold text-heading">
        Market prices
      </h2>
      <div className="overflow-hidden rounded-md border border-border bg-surface text-sm">
        {CARD_DETAIL_MARKET_PRICE_ROWS.map((row, index) => {
          const raw = cardDetailMarketPriceValue(prices, row.key);
          const formatted = cardDetailMarketPriceDisplay(raw, row.currency);
          const href = buildStoreSearchUrl(row.key, cardName);
          return (
            <a
              key={row.key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={STORE_LINK_LABELS[row.key]}
              className={`${cardDetailLinkedRowClassName}${index > 0 ? ' border-t border-border' : ''}`}
            >
              <span className="min-w-0">
                <span className="block font-medium text-heading">{row.label}</span>
                <span className="block text-xs text-text-2">{row.subtitle}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {formatted ? (
                  <span className="text-base font-semibold tabular-nums text-heading">
                    {formatted}
                  </span>
                ) : (
                  <span className="text-sm text-text-2">No listing</span>
                )}
                <span aria-hidden="true" className="text-xs leading-none text-text-2">
                  ↗
                </span>
              </span>
            </a>
          );
        })}
      </div>
      <p className="text-xs text-text-2">as of {formatPriceSnapshotDate(snapshotAt)}</p>
    </section>
  );
}

function CardDetailSets({ card, setIndex }: { card: YugiohCard; setIndex?: SetIndex | null }) {
  const [expanded, setExpanded] = useState(false);
  const sortedSets = useMemo(() => sortCardDetailSets(card.sets, setIndex), [card.sets, setIndex]);
  const totalCount = sortedSets.length;
  if (totalCount === 0) return null;

  const visibleCount = cardDetailSetsVisibleCount(totalCount, expanded);
  const visibleSets = sortedSets.slice(0, visibleCount);
  const expandLabel = cardDetailSetsExpandButtonLabel(totalCount);
  const showCollapse = cardDetailSetsShowCollapseButton(totalCount, expanded);

  return (
    <section className="flex flex-col gap-2" aria-labelledby="card-sets-heading">
      <h2 id="card-sets-heading" className="text-base font-semibold text-heading">
        {cardDetailSetsHeadingCount(totalCount)}
      </h2>
      <div className="overflow-hidden rounded-md border border-border bg-surface text-sm">
        <ul className="m-0 list-none p-0">
          {visibleSets.map((entry, index) => (
            <li
              key={`${entry.setCode}-${entry.setRarity}-${entry.setName}`}
              className={index > 0 ? 'border-t border-border' : undefined}
            >
              <Link
                to={buildCardDetailSetSearchHref(entry.setName)}
                className={cardDetailLinkedRowClassName}
                aria-label={`Search for cards in ${entry.setName}`}
              >
                <span className="min-w-0">
                  <span className="block font-medium text-heading">{entry.setName}</span>
                  <span className="block text-xs text-text-2">
                    {cardDetailSetRowSubtitle(
                      entry.setCode,
                      entry.setRarity,
                      entry.setName,
                      setIndex,
                    )}
                  </span>
                </span>
                <span aria-hidden="true" className="shrink-0 text-xs leading-none text-text-2">
                  ↗
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {expandLabel && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-fit text-sm font-medium text-heading underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          {expandLabel}
        </button>
      ) : null}
      {showCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="w-fit text-sm font-medium text-heading underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          Show fewer
        </button>
      ) : null}
    </section>
  );
}

function DetailMessage({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-6 text-text" role="status">
      <h1 className="text-xl font-semibold text-heading">{title}</h1>
      <p className="mt-2 text-sm text-text-2">{children}</p>
    </div>
  );
}

const backLinkClassName =
  'w-fit text-sm font-medium text-heading underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

function BackToSearchControl({ searchQuery }: { searchQuery: string | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fromSearch = (location.state as { fromSearch?: boolean } | null)?.fromSearch === true;

  if (fromSearch) {
    return (
      <button type="button" onClick={() => navigate(-1)} className={backLinkClassName}>
        ← Back to Search
      </button>
    );
  }

  const backHref =
    searchQuery && searchQuery.length > 0
      ? `/search?q=${encodeURIComponent(searchQuery)}`
      : '/search';

  return (
    <Link to={backHref} className={backLinkClassName}>
      ← Back to Search
    </Link>
  );
}

export function CardDetailPage() {
  const { id: idParam } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useCardCatalog();

  const cardId = Number.parseInt(idParam ?? '', 10);
  const searchQuery = searchParams.get('q');
  const formatParam = searchParams.get(FORMAT_QUERY_KEY);

  if (state.status === 'loading') {
    return (
      <DetailMessage title="Loading card…">
        Fetching the published catalog to show this card.
      </DetailMessage>
    );
  }

  if (state.status === 'empty' || state.status === 'error') {
    return (
      <DetailMessage title="Card unavailable">
        {state.status === 'error' ? state.message : 'The catalog has no cards to show right now.'}
      </DetailMessage>
    );
  }

  if (!Number.isFinite(cardId)) {
    return (
      <DetailMessage title="Invalid card link">
        This URL does not include a valid card passcode.
      </DetailMessage>
    );
  }

  const card = getCatalogDerived(state.cards).cardById.get(cardId);
  if (!card) {
    return (
      <div className="flex flex-col gap-4">
        <DetailMessage title="Card not found">
          No card in the published dataset matches that passcode.
        </DetailMessage>
        <BackToSearchControl searchQuery={searchQuery} />
      </div>
    );
  }

  const descriptionBlocks = buildCardDetailDescriptionBlocks(card);

  return (
    <div className="flex flex-col gap-6">
      <BackToSearchControl searchQuery={searchQuery} />
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <div className="w-full shrink-0 md:sticky md:top-4 md:max-w-[435px] md:self-start">
          <CardDetailArt key={card.id} card={card} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-heading">{card.name}</h1>
            <CardDetailBanStatus card={card} formatParam={formatParam} />
          </header>
          <CardDetailInfoChips card={card} />
          {descriptionBlocks.pendulumEffect ? (
            <section className="flex flex-col gap-2" aria-labelledby="card-pendulum-heading">
              <h2 id="card-pendulum-heading" className="text-base font-semibold text-heading">
                Pendulum Effect
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                {descriptionBlocks.pendulumEffect}
              </p>
            </section>
          ) : null}
          {descriptionBlocks.description ? (
            <section className="flex flex-col gap-2" aria-labelledby="card-description-heading">
              <h2 id="card-description-heading" className="text-base font-semibold text-heading">
                Description
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                {descriptionBlocks.description}
              </p>
            </section>
          ) : null}
          <div className="flex flex-col gap-3">
            <CardDetailMarketPrices
              cardName={card.name}
              prices={card.prices}
              snapshotAt={state.generatedAt}
            />
            <CardDetailSets key={card.id} card={card} setIndex={state.setIndex} />
          </div>
        </div>
      </div>
    </div>
  );
}
