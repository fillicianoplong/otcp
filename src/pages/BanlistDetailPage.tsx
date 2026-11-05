import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import { BanlistGridSection, BanlistListSection } from '../format/BanlistSectionViews.tsx';
import {
  FormatBanlistViewToggle,
  type FormatBanlistViewMode,
} from '../format/FormatBanlistViewToggle.tsx';
import { buildTcgBanlistDetailPageModel } from '../format/formatBanlistPageModel.ts';
import type { BanlistSnapshotCard, TcgBanlistSnapshot } from '../format/banlistSnapshotSchema.ts';
import {
  formatTcgBanlistUntilLabel,
  getTcgBanlistManifestEntry,
  isKnownTcgBanlistDate,
  isTcgBanlistInForce,
  loadTcgBanlistSnapshotWithPrevious,
} from '../format/tcgBanlists.ts';
import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';

const BANLIST_DETAIL_VIEW_STORAGE_KEY = 'otcp:view:banlist-detail';

function readBanlistDetailViewMode(): FormatBanlistViewMode {
  const raw = readLocalStorageString(BANLIST_DETAIL_VIEW_STORAGE_KEY);
  return raw === 'list' ? 'list' : 'grid';
}

function writeBanlistDetailViewMode(mode: FormatBanlistViewMode): void {
  writeLocalStorageString(BANLIST_DETAIL_VIEW_STORAGE_KEY, mode);
}

function BanlistMessage({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-6 text-text" role="status">
      <h1 className="text-xl font-semibold text-heading">{title}</h1>
      <p className="mt-2 text-sm text-text-2">{children}</p>
    </div>
  );
}

type LoadedBanlist = {
  snapshot: TcgBanlistSnapshot;
  previousCards: readonly BanlistSnapshotCard[] | undefined;
};

function LoadedBanlistDetail({ effectiveDate }: { effectiveDate: string }) {
  const manifestEntry = getTcgBanlistManifestEntry(effectiveDate);
  const { state: catalogState } = useCardCatalog();
  const [loaded, setLoaded] = useState<LoadedBanlist | 'loading' | 'missing' | 'error'>('loading');
  const [viewMode, setViewModeState] = useState<FormatBanlistViewMode>(() =>
    readBanlistDetailViewMode(),
  );

  useEffect(() => {
    let cancelled = false;
    loadTcgBanlistSnapshotWithPrevious(effectiveDate)
      .then((result) => {
        if (cancelled) return;
        setLoaded(result ?? 'missing');
      })
      .catch(() => {
        if (!cancelled) setLoaded('error');
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveDate]);

  const catalogCards = catalogState.status === 'ready' ? catalogState.cards : [];
  const pageModel =
    loaded !== 'loading' && loaded !== 'missing' && loaded !== 'error'
      ? buildTcgBanlistDetailPageModel(loaded.snapshot, loaded.previousCards, catalogCards)
      : null;

  const setViewMode = useCallback((mode: FormatBanlistViewMode) => {
    writeBanlistDetailViewMode(mode);
    setViewModeState(mode);
  }, []);

  if (loaded === 'loading') {
    return (
      <BanlistMessage title={`${effectiveDate}…`}>
        Loading this Forbidden &amp; Limited List.
      </BanlistMessage>
    );
  }

  if (loaded === 'missing' || loaded === 'error' || !manifestEntry || !pageModel) {
    return (
      <BanlistMessage title="Banlist unavailable">
        This list could not be loaded right now.
      </BanlistMessage>
    );
  }

  const inForce = isTcgBanlistInForce(manifestEntry);
  const SectionView = viewMode === 'list' ? BanlistListSection : BanlistGridSection;

  return (
    <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden">
      <div className="flex flex-col gap-3">
        <Link
          to="/banlists"
          className="w-fit text-sm font-medium text-heading underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          ← All banlists
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-heading">{pageModel.listName}</h1>
            <p className="mt-1 text-sm text-text-2">
              {formatTcgBanlistUntilLabel(manifestEntry, inForce)}
            </p>
            <p className="mt-0.5 text-xs tabular-nums text-text-3">
              Effective {pageModel.effectiveDate}
            </p>
          </div>
          <FormatBanlistViewToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {pageModel.changeSections.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-3">
          <h2 className="text-base font-semibold text-heading">Changes from the previous list</h2>
          {pageModel.changeSections.map((section) => (
            <SectionView
              key={`change-${section.id}`}
              section={section}
              headingIdPrefix="ban-change"
            />
          ))}
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="text-base font-semibold text-heading">Full list</h2>
        {pageModel.fullSections.map((section) => (
          <SectionView key={`full-${section.id}`} section={section} headingIdPrefix="ban-full" />
        ))}
      </div>
    </div>
  );
}

export function BanlistDetailPage() {
  const { effectiveDate: dateParam } = useParams();
  const effectiveDate = dateParam?.trim() ?? '';

  if (!isKnownTcgBanlistDate(effectiveDate)) {
    return (
      <BanlistMessage title="Unknown banlist">Pick a format from the Formats table.</BanlistMessage>
    );
  }

  return <LoadedBanlistDetail key={effectiveDate} effectiveDate={effectiveDate} />;
}
