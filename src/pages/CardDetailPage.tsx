import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';

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
import { LinkedRow } from '../ui/ListRow.tsx';
import { InfoCard } from '../ui/InfoCard.tsx';
import { PageContainer } from '../ui/PageContainer.tsx';
import { PageTitle } from '../ui/PageTitle.tsx';
import { SectionHeader } from '../ui/SectionHeader.tsx';
import { TableToolbar } from '../ui/TableToolbar.tsx';
import { isTableColumnVisible, type TableColumn } from '../ui/tableColumns.ts';
import { useTableColumnVisibility } from '../ui/useTableColumnVisibility.ts';
import { focusRingClass } from '../ui/classes.ts';
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
      <SectionHeader id="card-artworks-heading">Artworks</SectionHeader>
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

function CardDetailInfoChips({ card }: { card: YugiohCard }) {
  const chips = buildCardDetailChips(card);
  if (chips.length === 0) return null;

  return (
    <dl className="flex w-full flex-wrap gap-2" aria-label="Card stats">
      {chips.map((chip) => {
        const iconSrc = resolveCardDetailChipIconPath(chip.label, card);
        const searchHref = buildCardDetailChipSearchHref(chip, card);
        return (
          <InfoCard
            key={`${chip.label}-${chip.value}`}
            label={chip.label}
            to={searchHref ?? undefined}
            ariaLabel={searchHref ? cardDetailChipSearchAriaLabel(chip) : undefined}
            className="flex-[1_1_120px]"
          >
            <YgoCardIcon src={iconSrc} label={chip.value} tier="detail" />
          </InfoCard>
        );
      })}
    </dl>
  );
}

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
      <SectionHeader id="card-market-prices-heading">Market prices</SectionHeader>
      <div className="overflow-hidden rounded-md border border-border bg-surface text-sm">
        {CARD_DETAIL_MARKET_PRICE_ROWS.map((row, index) => {
          const raw = cardDetailMarketPriceValue(prices, row.key);
          const formatted = cardDetailMarketPriceDisplay(raw, row.currency);
          const href = buildStoreSearchUrl(row.key, cardName);
          return (
            <LinkedRow
              key={row.key}
              href={href}
              label={STORE_LINK_LABELS[row.key]}
              className={index > 0 ? 'border-t border-border' : undefined}
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
            </LinkedRow>
          );
        })}
      </div>
      <p className="text-xs text-text-2">as of {formatPriceSnapshotDate(snapshotAt)}</p>
    </section>
  );
}

const SET_COLUMNS: readonly TableColumn[] = [
  { id: 'set', label: 'Set', locked: true },
  { id: 'code', label: 'Code' },
  { id: 'rarity', label: 'Rarity' },
  { id: 'released', label: 'Released' },
];

const setLinkClassName = `min-w-0 truncate font-medium text-heading underline-offset-2 hover:underline ${focusRingClass}`;

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
  const [columnVisibility, setColumnVisibility] = useTableColumnVisibility(
    'card-sets',
    SET_COLUMNS,
  );
  const sortedSets = useMemo(() => sortCardDetailSets(card.sets, setIndex), [card.sets, setIndex]);
  const totalCount = sortedSets.length;
  const showColumn = (id: string) =>
    isTableColumnVisible(
      SET_COLUMNS.find((column) => column.id === id) ?? SET_COLUMNS[0]!,
      columnVisibility,
    );
  if (totalCount === 0) return null;

  const visibleCount = cardDetailSetsVisibleCount(totalCount, expanded);
  const visibleSets = sortedSets.slice(0, visibleCount);
  const expandLabel = cardDetailSetsExpandButtonLabel(totalCount);
  const showCollapse = cardDetailSetsShowCollapseButton(totalCount, expanded);
  const showArtMarks = hasCuratedSetArtPrintings(card.id);

  return (
    <section className="flex min-w-0 flex-col gap-2" aria-labelledby="card-sets-heading">
      <SectionHeader id="card-sets-heading">{cardDetailSetsHeadingCount(totalCount)}</SectionHeader>
      <TableToolbar
        columns={SET_COLUMNS}
        visibility={columnVisibility}
        onVisibilityChange={setColumnVisibility}
      />
      <div className="min-w-0 overflow-x-auto rounded-md border border-border bg-surface text-sm">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-surface-2 text-text-2">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                Set
              </th>
              {showColumn('code') ? (
                <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                  Code
                </th>
              ) : null}
              {showColumn('rarity') ? (
                <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                  Rarity
                </th>
              ) : null}
              {showColumn('released') ? (
                <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                  Released
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleSets.map((entry) => {
              const releaseDate = cardDetailSetRowReleaseDate(entry.setName, setIndex);
              const usesThisArt =
                showArtMarks && isSetRowMarkedForSelectedArt(card.id, selectedArtId, entry.setCode);
              return (
                <tr key={`${entry.setCode}-${entry.setRarity}-${entry.setName}`}>
                  <td className="px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <Link
                        to={buildCardDetailSetSearchHref(entry.setName)}
                        aria-label={`Search for cards in ${entry.setName}`}
                        className={setLinkClassName}
                      >
                        {entry.setName}
                      </Link>
                      {usesThisArt ? (
                        <span className="shrink-0 rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 text-2xs font-medium uppercase tracking-wide text-text-2">
                          This art
                        </span>
                      ) : null}
                    </span>
                  </td>
                  {showColumn('code') ? (
                    <td className="whitespace-nowrap px-3 py-2 text-text-2">{entry.setCode}</td>
                  ) : null}
                  {showColumn('rarity') ? (
                    <td className="whitespace-nowrap px-3 py-2 text-text-2">{entry.setRarity}</td>
                  ) : null}
                  {showColumn('released') ? (
                    <td className="whitespace-nowrap px-3 py-2 text-text-2 tabular-nums">
                      {releaseDate ?? '—'}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
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

export function CardDetailPage() {
  const { id: idParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useCardCatalog();

  const routeId = Number.parseInt(idParam ?? '', 10);
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
    <CardDetailReadyView key={routeId} state={state} routeId={routeId} formatParam={formatParam} />
  );
}

function CardDetailReadyView({
  state,
  routeId,
  formatParam,
}: {
  state: Extract<CatalogState, { status: 'ready' }>;
  routeId: number;
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
    <PageContainer className="flex flex-col gap-6">
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
            <PageTitle className="min-w-0">{card.name}</PageTitle>
            <CardDetailBanStatus card={card} formatParam={formatParam} />
          </header>
          <CardDetailInfoChips card={card} />
          {descriptionBlocks.pendulumEffect ? (
            <section className="flex flex-col gap-2" aria-labelledby="card-pendulum-heading">
              <SectionHeader id="card-pendulum-heading">Pendulum Effect</SectionHeader>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                {descriptionBlocks.pendulumEffect}
              </p>
            </section>
          ) : null}
          {descriptionBlocks.description ? (
            <section className="flex flex-col gap-2" aria-labelledby="card-description-heading">
              <SectionHeader id="card-description-heading">Description</SectionHeader>
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
    </PageContainer>
  );
}
