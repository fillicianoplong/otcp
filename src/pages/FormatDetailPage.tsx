import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';

import { BanThumbMarker } from '../catalog/BanThumbMarker.tsx';
import { CardListRow } from '../catalog/CardListRow.tsx';
import { CATALOG_GRID_CLASS } from '../catalog/catalogGridLayout.ts';
import { buildSearchCardDetailPath } from '../catalog/searchCardLinks.ts';
import { banMarkerForStatus, type BanDisplayStatus } from '../catalog/formatBanContext.ts';
import { formatCardCount } from '../catalog/formatCardCount.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import { YgoCardIcon } from '../components/YgoCardIcon.tsx';
import { resolveYgoBanStatusIconPath } from '../catalog/cardIcons.ts';
import {
  FormatBanlistViewToggle,
  type FormatBanlistViewMode,
} from '../format/FormatBanlistViewToggle.tsx';
import {
  getFormatById,
  normalizeFormatId,
  searchWithFormatPath,
  type FormatId,
} from '../format/formatCatalog.ts';
import { resolveFormatBanStatus } from '../format/formatBanStatus.ts';
import { writeFormatPreference } from '../format/formatPreference.ts';
import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

const FORMAT_DETAIL_VIEW_STORAGE_KEY = 'otcp:view:format-detail';

const BAN_GROUP_ORDER: readonly BanDisplayStatus[] = ['Forbidden', 'Limited', 'Semi-Limited'];

function readFormatDetailViewMode(): FormatBanlistViewMode {
  const raw = readLocalStorageString(FORMAT_DETAIL_VIEW_STORAGE_KEY);
  return raw === 'list' ? 'list' : 'grid';
}

function writeFormatDetailViewMode(mode: FormatBanlistViewMode): void {
  writeLocalStorageString(FORMAT_DETAIL_VIEW_STORAGE_KEY, mode);
}

function FormatDetailMessage({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-6 text-text" role="status">
      <h1 className="text-xl font-semibold text-heading">{title}</h1>
      <p className="mt-2 text-sm text-text-2">{children}</p>
    </div>
  );
}

function BanGroupHeading({ status, count }: { status: BanDisplayStatus; count: number }) {
  const { label } = banMarkerForStatus(status);
  return (
    <div className="flex items-center gap-2 px-1 py-2">
      <YgoCardIcon
        src={resolveYgoBanStatusIconPath(status, 'row')}
        label={label}
        tier="row"
        iconOnly
      />
      <span className="text-sm font-medium text-heading">{formatCardCount(count)}</span>
    </div>
  );
}

function FormatBanGridGroup({
  status,
  cards,
  formatId,
}: {
  status: BanDisplayStatus;
  cards: readonly YugiohCard[];
  formatId: FormatId;
}) {
  if (cards.length === 0) return null;

  return (
    <section aria-labelledby={`ban-group-${status}`} className="flex flex-col gap-2">
      <h2 id={`ban-group-${status}`}>
        <BanGroupHeading status={status} count={cards.length} />
      </h2>
      <ul className={CATALOG_GRID_CLASS}>
        {cards.map((card) => {
          const banStatus = resolveFormatBanStatus(card, formatId);
          return (
            <li key={card.id}>
              <Link
                to={buildSearchCardDetailPath(card.id, { formatParam: formatId })}
                aria-label={card.name}
                className="block rounded-sm transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
              >
                <div className="relative w-full overflow-hidden">
                  <img
                    src={card.images.small}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="aspect-[59/86] w-full object-cover"
                  />
                  {banStatus ? <BanThumbMarker status={banStatus} /> : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function FormatBanListGroup({
  status,
  cards,
  formatId,
}: {
  status: BanDisplayStatus;
  cards: readonly YugiohCard[];
  formatId: FormatId;
}) {
  if (cards.length === 0) return null;

  return (
    <section
      aria-labelledby={`ban-list-group-${status}`}
      className="overflow-hidden rounded-md border border-border bg-surface"
    >
      <div className="border-b border-border px-3">
        <BanGroupHeading status={status} count={cards.length} />
      </div>
      <ul className="divide-y divide-border">
        {cards.map((card) => (
          <CardListRow
            key={card.id}
            card={card}
            searchQuery=""
            formatParam={formatId}
            detailPath={buildSearchCardDetailPath(card.id, { formatParam: formatId })}
          />
        ))}
      </ul>
    </section>
  );
}

function groupCardsByBanStatus(
  cards: readonly YugiohCard[],
  formatId: FormatId,
): Record<BanDisplayStatus, YugiohCard[]> {
  const groups: Record<BanDisplayStatus, YugiohCard[]> = {
    Forbidden: [],
    Limited: [],
    'Semi-Limited': [],
  };

  for (const card of cards) {
    const status = resolveFormatBanStatus(card, formatId);
    if (status) {
      groups[status].push(card);
    }
  }

  for (const status of BAN_GROUP_ORDER) {
    groups[status].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }

  return groups;
}

export function FormatDetailPage() {
  const { formatId: formatIdParam } = useParams();
  const formatId = normalizeFormatId(formatIdParam);
  const format = formatId ? getFormatById(formatId) : undefined;
  const { state: catalogState } = useCardCatalog();
  const [viewMode, setViewModeState] = useState<FormatBanlistViewMode>(() =>
    readFormatDetailViewMode(),
  );

  useEffect(() => {
    if (formatId) {
      writeFormatPreference(formatId);
    }
  }, [formatId]);

  const banGroups = useMemo(() => {
    if (!formatId || catalogState.status !== 'ready') return null;
    return groupCardsByBanStatus(catalogState.cards, formatId);
  }, [catalogState, formatId]);

  const setViewMode = useCallback((mode: FormatBanlistViewMode) => {
    writeFormatDetailViewMode(mode);
    setViewModeState(mode);
  }, []);

  if (!formatId || !format) {
    return (
      <FormatDetailMessage title="Unknown format">
        Pick Advanced or Traditional from the Formats list.
      </FormatDetailMessage>
    );
  }

  if (catalogState.status === 'loading') {
    return (
      <FormatDetailMessage title={`${format.name}…`}>
        Loading the published catalog to build this banlist.
      </FormatDetailMessage>
    );
  }

  if (catalogState.status !== 'ready' || !banGroups) {
    return (
      <FormatDetailMessage title={`${format.name} unavailable`}>
        The catalog could not be loaded right now.
      </FormatDetailMessage>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/formats"
          className="w-fit text-sm font-medium text-heading underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          ← All formats
        </Link>
        <h1 className="text-2xl font-semibold text-heading">{format.name}</h1>
        <p className="text-sm text-text-2">{format.deckRulesSummary}</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-heading">Banlist · {format.banlistHeading}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={searchWithFormatPath(formatId)}
              className="inline-flex min-h-[var(--touch-min)] items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
            >
              Search in {format.name}
            </Link>
            <FormatBanlistViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {BAN_GROUP_ORDER.map((status) =>
            viewMode === 'list' ? (
              <FormatBanListGroup
                key={status}
                status={status}
                cards={banGroups[status]}
                formatId={formatId}
              />
            ) : (
              <FormatBanGridGroup
                key={status}
                status={status}
                cards={banGroups[status]}
                formatId={formatId}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
