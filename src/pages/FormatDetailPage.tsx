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
  type FormatBanlistPageModel,
} from '../format/formatBanlistPageModel.ts';
import { isGenesysPlaceholderCardId } from '../format/genesysPlaceholderCard.ts';
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

function FormatBanNameTile({ name }: { name: string }) {
  return (
    <div className="flex aspect-[59/86] w-full items-center justify-center rounded-sm border border-border bg-surface-2 p-1 text-center text-[10px] leading-tight text-heading">
      {name}
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
  const { card, banStatus, changeBadge, genesysPoints } = entry;
  const placeholder = isGenesysPlaceholderCardId(card.id);
  const tile = (
    <div className="relative w-full overflow-hidden">
      {card.images.small ? (
        <img
          src={card.images.small}
          alt=""
          loading="lazy"
          decoding="async"
          className="aspect-[59/86] w-full object-cover"
        />
      ) : (
        <FormatBanNameTile name={card.name} />
      )}
      {banStatus ? <BanThumbMarker status={banStatus} /> : null}
      {changeBadge ? <BanlistChangeBadgeMarker badge={changeBadge} /> : null}
      {genesysPoints != null ? (
        <span className="absolute bottom-0 left-0 right-0 bg-bg/90 px-1 py-0.5 text-center text-[10px] font-medium leading-tight text-heading">
          {genesysPoints} pts
        </span>
      ) : null}
    </div>
  );

  if (placeholder) {
    return (
      <li aria-label={card.name} className="block rounded-sm">
        {tile}
      </li>
    );
  }

  return (
    <li>
      <Link
        to={buildSearchCardDetailPath(card.id, { formatParam: formatId })}
        aria-label={card.name}
        className="block rounded-sm transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
      >
        {tile}
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
        {section.cards.map((entry) => {
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
                    className="aspect-[59/86] w-full object-cover"
                  />
                ) : (
                  <FormatBanNameTile name={entry.card.name} />
                )}
              </div>
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-heading">
                {entry.card.name}
              </p>
              {entry.genesysPoints != null ? (
                <span className="shrink-0 text-sm text-heading">{entry.genesysPoints} pts</span>
              ) : null}
            </>
          );

          if (entry.genesysPoints != null) {
            return (
              <li key={`${entry.card.id}-${entry.genesysPoints}`}>
                {placeholder ? (
                  <div className="flex items-center gap-3 px-2 py-2">{rowBody}</div>
                ) : (
                  <Link
                    to={buildSearchCardDetailPath(entry.card.id, { formatParam: formatId })}
                    className="flex items-center gap-3 px-2 py-2 transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong"
                  >
                    {rowBody}
                  </Link>
                )}
              </li>
            );
          }

          return (
            <CardListRow
              key={entry.card.id}
              card={entry.card}
              searchQuery=""
              formatParam={formatId}
              detailPath={buildSearchCardDetailPath(entry.card.id, { formatParam: formatId })}
            />
          );
        })}
      </ul>
    </section>
  );
}

function FormatPoolPreviewGrid({
  preview,
  formatId,
}: {
  preview: NonNullable<FormatBanlistPageModel['poolPreview']>;
  formatId: FormatId;
}) {
  if (preview.cards.length === 0) return null;

  return (
    <section
      aria-labelledby="speed-duel-pool-preview"
      className="flex flex-col gap-3 overflow-x-hidden rounded-md border border-border bg-surface p-3"
    >
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h2 id="speed-duel-pool-preview" className="text-base font-semibold text-heading">
          {preview.heading}
        </h2>
        <span className="text-xs text-text-2">{formatCardCount(preview.cards.length)}</span>
      </div>
      <ul className={CATALOG_GRID_CLASS}>
        {preview.cards.map((entry) => (
          <FormatBanGridTile key={entry.card.id} entry={entry} formatId={formatId} />
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

  const restrictedSections = pageModel.sections.filter((section) => section.cards.length > 0);
  const poolPreview = restrictedSections.length === 0 ? pageModel.poolPreview : undefined;

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
        {restrictedSections.map((section) =>
          viewMode === 'list' ? (
            <FormatBanListSection key={section.id} section={section} formatId={formatId} />
          ) : (
            <FormatBanGridSection key={section.id} section={section} formatId={formatId} />
          ),
        )}
        {poolPreview ? (
          viewMode === 'list' ? (
            <section
              aria-labelledby="speed-duel-pool-preview"
              className="overflow-hidden rounded-md border border-border bg-surface"
            >
              <div className="flex items-baseline justify-between gap-2 border-b border-border px-3 py-2">
                <h2 id="speed-duel-pool-preview" className="text-base font-semibold text-heading">
                  {poolPreview.heading}
                </h2>
                <span className="text-xs text-text-2">
                  {formatCardCount(poolPreview.cards.length)}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {poolPreview.cards.map((entry) => (
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
          ) : (
            <FormatPoolPreviewGrid preview={poolPreview} formatId={formatId} />
          )
        ) : null}
      </div>
    </div>
  );
}
