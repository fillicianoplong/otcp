import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';

import { cardDetailImageSrc, YGO_CARD_ART_ASPECT_CLASS } from '../catalog/cardArtUrl.ts';
import { resolveArtIds, resolveSelectedArtId } from '../catalog/cardArt.ts';
import {
  findCatalogCardByRouteId,
  resolveCardDetailRouteUnknownId,
  type ResolvedCardDetailRoute,
} from '../catalog/cardDetailRoute.ts';
import { queueYgoproArtIdLookup } from '../catalog/ygoproArtIds.ts';
import { CatalogArtImage, CatalogArtThumbnail } from '../catalog/CatalogArtImage.tsx';
import {
  buildCardDetailChips,
  buildCardDetailChipSearchHref,
  cardDetailChipSearchAriaLabel,
} from '../catalog/cardDetailChips.ts';
import {
  resolveCardDetailChipIconPath,
  resolveYgoBanStatusIconPath,
} from '../catalog/cardIcons.ts';
import { buildCardDetailDescriptionBlocks } from '../catalog/cardDetailDescriptions.ts';
import {
  CARD_DETAIL_MARKET_PRICE_ROWS,
  CARD_DETAIL_MARKET_PRICE_SUBTITLE,
  cardDetailMarketPriceDisplay,
  cardDetailMarketPriceValue,
} from '../catalog/cardDetailMarketPrices.ts';
import {
  buildCardDetailSetSearchHref,
  cardDetailSetRowCodeRarity,
  cardDetailSetRowReleaseDate,
  cardDetailSetsExpandButtonLabel,
  cardDetailSetsHeadingCount,
  cardDetailSetsShowCollapseButton,
  cardDetailSetsVisibleCount,
  sortCardDetailSets,
} from '../catalog/cardDetailSets.ts';
import {
  hasCuratedSetArtPrintings,
  isSetRowMarkedForSelectedArt,
} from '../catalog/setArtPrintings.ts';
import { getCatalogDerived } from '../catalog/catalogDerived.ts';
import { buildSearchPathWithFormat } from '../catalog/searchCardLinks.ts';
import type { CardDetailLinkState } from '../catalog/searchNavigation.ts';
import { getFormatById } from '../format/formatCatalog.ts';
import {
  banMarkerForStatus,
  isFormatBanContextActive,
  resolveCardBanForFormat,
} from '../catalog/formatBanContext.ts';
import { resolveFormatPreference, readFormatPreference } from '../format/formatPreference.ts';
import { fetchCardDetailRecord } from '../catalog/loadCardDetail.ts';
import type { CatalogState } from '../catalog/loadCatalog.ts';
import { CardImageZoomViewer } from '../components/CardImageZoomViewer.tsx';
import { YgoCardIcon } from '../components/YgoCardIcon.tsx';
import { formatPriceSnapshotDate } from '../prices/formatPrice.ts';
import { buildStoreSearchUrl, STORE_LINK_LABELS } from '../prices/storeLinks.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import type { CardPrices } from '../shared/schema/core.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

function CardDetailArt({ card, selectedArtId }: { card: YugiohCard; selectedArtId: number }) {
  const artId = resolveSelectedArtId(card, selectedArtId);
  const [viewerSrc, setViewerSrc] = useState(() => cardDetailImageSrc(card, artId));
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
        <div
          className={`relative w-full overflow-hidden rounded-md border border-border bg-surface-2 ${YGO_CARD_ART_ASPECT_CLASS}`}
        >
          <CatalogArtImage
            card={card}
            imageId={artId}
            size="large"
            alt={card.name}
            loading="eager"
            onResolvedSrc={setViewerSrc}
            imgClassName="absolute inset-0 h-full w-full object-cover object-left-top"
          />
        </div>
      </button>
      {viewerOpen ? (
        <CardImageZoomViewer
          src={viewerSrc}
          alt={card.name}
          onClose={closeViewer}
          triggerRef={triggerRef}
        />
      ) : null}
    </>
  );
}

function CardDetailArtworks({
  card,
  selectedArtId,
  onSelectArtId,
}: {
  card: YugiohCard;
  selectedArtId: number;
  onSelectArtId: (imageId: number) => void;
}) {
  const artId = resolveSelectedArtId(card, selectedArtId);
  const artIds = resolveArtIds(card);
  if (artIds.length < 2) return null;

  return (
    <section className="flex min-w-0 flex-col gap-2" aria-labelledby="card-artworks-heading">
      <h2 id="card-artworks-heading" className="text-base font-semibold text-heading">
        Artworks
      </h2>
      <ul
        className="m-0 flex max-w-full list-none flex-wrap gap-2 p-0"
        aria-label="Artwork variants"
      >
        {artIds.map((imageId) => (
          <li key={imageId}>
            <CatalogArtThumbnail
              card={card}
              imageId={imageId}
              selected={imageId === artId}
              onSelect={() => onSelectArtId(imageId)}
              ariaLabel={`Show artwork ${imageId} for ${card.name}`}
            />
          </li>
        ))}
      </ul>
    </section>
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
  const { label } = banMarkerForStatus(status);
  return (
    <span title={label}>
      <YgoCardIcon
        src={resolveYgoBanStatusIconPath(status, 'detail')}
        label={label}
        tier="detail"
        iconOnly
      />
    </span>
  );
}

const cardDetailChipFlexClassName = 'min-w-0 flex-[1_1_120px]';

const cardDetailChipClassName = `${cardDetailChipFlexClassName} flex flex-col gap-0.5 rounded-md border border-border bg-surface px-3 py-2 text-sm`;

const cardDetailLinkedChipClassName = `${cardDetailChipClassName} no-underline text-inherit transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong`;

function CardDetailInfoChips({ card }: { card: YugiohCard }) {
  const chips = buildCardDetailChips(card);
  if (chips.length === 0) return null;

  return (
    <dl className="flex w-full flex-wrap gap-2" aria-label="Card stats">
      {chips.map((chip) => {
        const iconSrc = resolveCardDetailChipIconPath(chip.label, card);
        const searchHref = buildCardDetailChipSearchHref(chip, card);
        const className = searchHref ? cardDetailLinkedChipClassName : cardDetailChipClassName;
        const content = (
          <>
            <dt className="text-xs font-medium text-text-2">{chip.label}</dt>
            <dd className="font-medium text-heading">
              <YgoCardIcon src={iconSrc} label={chip.value} tier="detail" />
            </dd>
          </>
        );
        return searchHref ? (
          <Link
            key={`${chip.label}-${chip.value}`}
            to={searchHref}
            className={className}
            aria-label={cardDetailChipSearchAriaLabel(chip)}
          >
            {content}
          </Link>
        ) : (
          <div key={`${chip.label}-${chip.value}`} className={className}>
            {content}
          </div>
        );
      })}
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
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium text-heading">{row.label}</span>
                <span className="text-xs text-text-2">{CARD_DETAIL_MARKET_PRICE_SUBTITLE}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {formatted ? (
                  <span className="text-sm font-semibold tabular-nums text-heading">
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

function CardDetailSets({
  card,
  setIndex,
  selectedArtId,
}: {
  card: YugiohCard;
  setIndex?: SetIndex | null;
  selectedArtId: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const sortedSets = useMemo(() => sortCardDetailSets(card.sets, setIndex), [card.sets, setIndex]);
  const totalCount = sortedSets.length;
  if (totalCount === 0) return null;

  const visibleCount = cardDetailSetsVisibleCount(totalCount, expanded);
  const visibleSets = sortedSets.slice(0, visibleCount);
  const expandLabel = cardDetailSetsExpandButtonLabel(totalCount);
  const showCollapse = cardDetailSetsShowCollapseButton(totalCount, expanded);
  const showArtMarks = hasCuratedSetArtPrintings(card.id);

  return (
    <section className="flex flex-col gap-2" aria-labelledby="card-sets-heading">
      <h2 id="card-sets-heading" className="text-base font-semibold text-heading">
        {cardDetailSetsHeadingCount(totalCount)}
      </h2>
      <div className="overflow-hidden rounded-md border border-border bg-surface text-sm">
        <ul className="m-0 list-none p-0">
          {visibleSets.map((entry, index) => {
            const releaseDate = cardDetailSetRowReleaseDate(entry.setName, setIndex);
            const usesThisArt =
              showArtMarks && isSetRowMarkedForSelectedArt(card.id, selectedArtId, entry.setCode);
            return (
              <li
                key={`${entry.setCode}-${entry.setRarity}-${entry.setName}`}
                className={index > 0 ? 'border-t border-border' : undefined}
              >
                <Link
                  to={buildCardDetailSetSearchHref(entry.setName)}
                  className={cardDetailLinkedRowClassName}
                  aria-label={`Search for cards in ${entry.setName}`}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium text-heading">{entry.setName}</span>
                    <span className="text-xs text-text-2">
                      {cardDetailSetRowCodeRarity(entry.setCode, entry.setRarity)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {usesThisArt ? (
                      <span className="rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-2">
                        This art
                      </span>
                    ) : null}
                    {releaseDate ? (
                      <span className="text-xs text-text-2 tabular-nums">{releaseDate}</span>
                    ) : null}
                    <span aria-hidden="true" className="text-xs leading-none text-text-2">
                      ↗
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
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

function BackToSearchControl({
  searchQuery,
  formatParam,
}: {
  searchQuery: string | null;
  formatParam: string | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const linkState = location.state as CardDetailLinkState | null;
  const fromSearch = linkState?.fromSearch === true;
  const returnFormatId = linkState?.returnFormatId;

  if (fromSearch) {
    return (
      <button type="button" onClick={() => navigate(-1)} className={backLinkClassName}>
        ← Back to Search
      </button>
    );
  }

  if (returnFormatId) {
    const formatName = getFormatById(returnFormatId)?.name ?? 'format';
    return (
      <Link to={`/formats/${returnFormatId}`} className={backLinkClassName}>
        ← Back to {formatName}
      </Link>
    );
  }

  const params = new URLSearchParams();
  if (searchQuery && searchQuery.length > 0) {
    params.set('q', searchQuery);
  }
  const backHref = buildSearchPathWithFormat(formatParam, params.toString());

  return (
    <Link to={backHref} className={backLinkClassName}>
      ← Back to Search
    </Link>
  );
}

export function CardDetailPage() {
  const { id: idParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useCardCatalog();

  const routeId = Number.parseInt(idParam ?? '', 10);
  const searchQuery = searchParams.get('q');
  const resolvedFormat = useMemo(
    () =>
      resolveFormatPreference({
        urlParam: searchParams.get('format'),
        storedRaw: readFormatPreference(),
      }),
    [searchParams],
  );
  const formatParam = resolvedFormat.formatId;

  useEffect(() => {
    const raw = searchParams.get('art');
    if (raw == null || raw.length === 0) return;
    const artId = Number.parseInt(raw, 10);
    if (!Number.isFinite(artId)) return;
    const params = new URLSearchParams(searchParams);
    params.delete('art');
    const search = params.toString();
    navigate(
      { pathname: `/search/card/${artId}`, search: search ? `?${search}` : '' },
      { replace: true },
    );
  }, [navigate, searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [idParam]);

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

  if (!Number.isFinite(routeId)) {
    return (
      <DetailMessage title="Invalid card link">
        This URL does not include a valid card passcode.
      </DetailMessage>
    );
  }

  return (
    <CardDetailReadyView
      key={routeId}
      state={state}
      routeId={routeId}
      searchQuery={searchQuery}
      formatParam={formatParam}
    />
  );
}

function CardDetailReadyView({
  state,
  routeId,
  searchQuery,
  formatParam,
}: {
  state: Extract<CatalogState, { status: 'ready' }>;
  routeId: number;
  searchQuery: string | null;
  formatParam: string | null;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const derived = useMemo(() => getCatalogDerived(state.cards), [state.cards]);
  const syncResolved = useMemo(
    () => findCatalogCardByRouteId(derived, routeId),
    [derived, routeId],
  );
  const [asyncResolved, setAsyncResolved] = useState<ResolvedCardDetailRoute | null>(null);
  const [asyncFinished, setAsyncFinished] = useState(false);

  const resolved = syncResolved ?? asyncResolved;

  useEffect(() => {
    if (syncResolved) return;
    let cancelled = false;
    void resolveCardDetailRouteUnknownId(derived, routeId).then((next) => {
      if (!cancelled) {
        setAsyncResolved(next ?? null);
        setAsyncFinished(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [derived, routeId, syncResolved]);

  const searchCard = resolved?.card ?? null;
  const selectedArtId = resolved?.selectedArtId ?? routeId;
  const [detailCard, setDetailCard] = useState<YugiohCard | null>(null);
  const [detailLoading, setDetailLoading] = useState(Boolean(state.detailSource));

  useEffect(() => {
    if (searchCard) queueYgoproArtIdLookup(searchCard.id);
    queueYgoproArtIdLookup(routeId);
  }, [routeId, searchCard]);

  useEffect(() => {
    if (!searchCard || !state.detailSource) return;
    let cancelled = false;
    void fetchCardDetailRecord(searchCard, state.detailSource)
      .then((merged) => {
        if (!cancelled) {
          setDetailCard(merged);
          setDetailLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchCard, state.detailSource]);

  if (!resolved && !syncResolved && !asyncFinished) {
    return (
      <DetailMessage title="Loading card…">
        Looking up this artwork in the published catalog.
      </DetailMessage>
    );
  }

  if (!searchCard) {
    return (
      <div className="flex flex-col gap-4">
        <DetailMessage title="Card not found">
          No card in the published dataset matches that passcode.
        </DetailMessage>
        <BackToSearchControl searchQuery={searchQuery} formatParam={formatParam} />
      </div>
    );
  }

  const card = state.detailSource ? (detailCard ?? searchCard) : searchCard;

  const selectArtId = (imageId: number) => {
    const params = new URLSearchParams(searchParams);
    params.delete('art');
    const search = params.toString();
    navigate({
      pathname: `/search/card/${imageId}`,
      search: search ? `?${search}` : '',
    });
  };

  if (state.detailSource && detailLoading && !detailCard) {
    return (
      <DetailMessage title="Loading card…">Fetching full details for this card.</DetailMessage>
    );
  }

  const descriptionBlocks = buildCardDetailDescriptionBlocks(card);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <BackToSearchControl searchQuery={searchQuery} formatParam={formatParam} />
      {/* Width fits the viewport height, leaves a gutter, and still yields to the info column. */}
      <div className="flex w-full min-w-0 flex-col gap-6 md:flex-row md:items-start md:gap-12">
        <div className="w-full min-w-0 md:sticky md:top-4 md:w-[min(42rem,calc((100dvh-10rem)*421/614),calc(100%-25rem))] md:shrink-0">
          <CardDetailArt
            key={`${card.id}-${selectedArtId}`}
            card={card}
            selectedArtId={selectedArtId}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 text-2xl font-semibold text-heading">{card.name}</h1>
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
          <CardDetailArtworks
            card={card}
            selectedArtId={selectedArtId}
            onSelectArtId={selectArtId}
          />
          <div className="flex flex-col gap-3">
            <CardDetailMarketPrices
              cardName={card.name}
              prices={card.prices}
              snapshotAt={state.generatedAt}
            />
            <CardDetailSets
              key={`${card.id}-${selectedArtId}`}
              card={card}
              setIndex={state.setIndex}
              selectedArtId={selectedArtId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
