import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';

import { BanThumbMarker } from '../catalog/BanThumbMarker.tsx';
import { CardListRow } from '../catalog/CardListRow.tsx';
import { CATALOG_GRID_CLASS } from '../catalog/catalogGridLayout.ts';
import { buildSearchCardDetailPath } from '../catalog/searchCardLinks.ts';
import { formatCardCount } from '../catalog/formatCardCount.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import { BanlistChangeBadgeMarker } from '../format/BanlistChangeBadgeMarker.tsx';
import { buildFormatDetailFacts } from '../format/formatDetailFacts.ts';
import { FormatDetailFactsBlock } from '../format/FormatDetailFactsBlock.tsx';
import {
  FormatBanlistViewToggle,
  type FormatBanlistViewMode,
} from '../format/FormatBanlistViewToggle.tsx';
import {
  buildFormatBanlistPageModel,
  type FormatBanlistCardEntry,
  type FormatBanlistSection,
} from '../format/formatBanlistPageModel.ts';
import {
  getFormatById,
  normalizeFormatId,
  searchWithFormatPath,
  type FormatId,
} from '../format/formatCatalog.ts';
import { writeFormatPreference } from '../format/formatPreference.ts';
import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';

const FORMAT_DETAIL_VIEW_STORAGE_KEY = 'otcp:view:format-detail';

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

function FormatBanGridTile({
  entry,
  formatId,
}: {
  entry: FormatBanlistCardEntry;
  formatId: FormatId;
}) {
  const { card, banStatus, changeBadge } = entry;
  return (
    <li>
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
          {changeBadge ? <BanlistChangeBadgeMarker badge={changeBadge} /> : null}
        </div>
      </Link>
    </li>
  );
}

function FormatBanGridSection({
  section,
  formatId,
}: {
  section: FormatBanlistSection;
  formatId: FormatId;
}) {
  if (section.cards.length === 0) return null;

  return (
    <section
      aria-labelledby={`ban-section-${section.id}`}
      className="flex flex-col gap-3 overflow-x-hidden rounded-md border border-border bg-surface p-3"
    >
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h2 id={`ban-section-${section.id}`} className="text-base font-semibold text-heading">
          {section.heading}
        </h2>
        <span className="text-xs text-text-2">{formatCardCount(section.cards.length)}</span>
      </div>
      <ul className={CATALOG_GRID_CLASS}>
        {section.cards.map((entry) => (
          <FormatBanGridTile key={entry.card.id} entry={entry} formatId={formatId} />
        ))}
      </ul>
    </section>
  );
}

function FormatBanListSection({
  section,
  formatId,
}: {
  section: FormatBanlistSection;
  formatId: FormatId;
}) {
  if (section.cards.length === 0) return null;

  return (
    <section
      aria-labelledby={`ban-list-section-${section.id}`}
      className="overflow-hidden rounded-md border border-border bg-surface"
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-border px-3 py-2">
        <h2 id={`ban-list-section-${section.id}`} className="text-base font-semibold text-heading">
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
            formatParam={formatId}
            detailPath={buildSearchCardDetailPath(entry.card.id, { formatParam: formatId })}
          />
        ))}
      </ul>
    </section>
  );
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

  const pageModel = useMemo(() => {
    if (!format || catalogState.status !== 'ready') return null;
    return buildFormatBanlistPageModel(format, catalogState.cards);
  }, [catalogState, format]);

  const detailFacts = useMemo(() => (format ? buildFormatDetailFacts(format) : null), [format]);

  const setViewMode = useCallback((mode: FormatBanlistViewMode) => {
    writeFormatDetailViewMode(mode);
    setViewModeState(mode);
  }, []);

  if (!formatId || !format) {
    return (
      <FormatDetailMessage title="Unknown format">
        Pick a format from the Formats list.
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

  if (catalogState.status !== 'ready' || !pageModel) {
    return (
      <FormatDetailMessage title={`${format.name} unavailable`}>
        The catalog could not be loaded right now.
      </FormatDetailMessage>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden">
      <div className="flex flex-col gap-3">
        <Link
          to="/formats"
          className="w-fit text-sm font-medium text-heading underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          ← All formats
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="min-w-0 flex-1 text-2xl font-semibold text-heading">{format.name}</h1>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              to={searchWithFormatPath(formatId)}
              onClick={() => writeFormatPreference(formatId)}
              className="inline-flex min-h-[var(--touch-min)] items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
            >
              Card pool
            </Link>
            <FormatBanlistViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>
        {detailFacts ? <FormatDetailFactsBlock facts={detailFacts} /> : null}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        {pageModel.sections.map((section) =>
          viewMode === 'list' ? (
            <FormatBanListSection key={section.id} section={section} formatId={formatId} />
          ) : (
            <FormatBanGridSection key={section.id} section={section} formatId={formatId} />
          ),
        )}
      </div>
    </div>
  );
}
