import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { CatalogViewToggle } from '../catalog/CatalogViewToggle.tsx';
import {
  CATALOG_TABLE_TOOLBAR_COLUMNS,
  catalogTableVisibilityFromRecord,
} from '../catalog/catalogTableColumns.ts';
import {
  CATALOG_WIDE_LAYOUT_MIN_WIDTH_PX,
  effectiveCatalogViewMode,
  parseCatalogViewMode,
  type CatalogViewMode,
} from '../catalog/catalogViewMode.ts';
import { useMinViewportWidth } from '../hooks/useMinViewportWidth.ts';
import { PageContainer } from '../ui/PageContainer.tsx';
import { SearchIcon, ToolbarIconButton } from '../ui/ToolbarIconButton.tsx';
import { PageTitle } from '../ui/PageTitle.tsx';
import { TableToolbar } from '../ui/TableToolbar.tsx';
import { Toolbar } from '../ui/Toolbar.tsx';
import { useTableColumnVisibility } from '../ui/useTableColumnVisibility.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import {
  BanlistGridSection,
  BanlistListSection,
  BanlistTableSection,
} from '../format/BanlistSectionViews.tsx';
import { buildFormatDetailFacts } from '../format/formatDetailFacts.ts';
import {
  FormatDetailFactsBlock,
  FormatDetailSourcesFooter,
} from '../format/FormatDetailFactsBlock.tsx';
import {
  buildFormatBanlistPageModel,
  buildTcgDatedFormatBanlistPageModel,
  type FormatBanlistPageModel,
  type FormatBanlistSection,
} from '../format/formatBanlistPageModel.ts';
import { loadTcgBanlistSnapshotWithPrevious } from '../format/tcgBanlists.ts';
import {
  getFormatById,
  normalizeFormatId,
  searchWithFormatPath,
  type FormatId,
} from '../format/formatCatalog.ts';
import { writeFormatPreference } from '../format/formatPreference.ts';
import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';

const FORMAT_DETAIL_VIEW_STORAGE_KEY = 'otcp:view:format-detail';

function readFormatDetailViewMode(): CatalogViewMode {
  const raw = readLocalStorageString(FORMAT_DETAIL_VIEW_STORAGE_KEY);
  return parseCatalogViewMode(raw);
}

function writeFormatDetailViewMode(mode: CatalogViewMode): void {
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

function FormatBanlistSections({
  sections,
  formatId,
  viewMode,
  columnVisibility,
}: {
  sections: FormatBanlistSection[];
  formatId: FormatId;
  viewMode: CatalogViewMode;
  columnVisibility: ReturnType<typeof catalogTableVisibilityFromRecord>;
}) {
  return (
    <>
      {sections.map((section) => {
        if (viewMode === 'grid') {
          return <BanlistGridSection key={section.id} section={section} formatParam={formatId} />;
        }
        if (viewMode === 'table') {
          return (
            <BanlistTableSection
              key={section.id}
              section={section}
              formatParam={formatId}
              columnVisibility={columnVisibility}
            />
          );
        }
        return <BanlistListSection key={section.id} section={section} formatParam={formatId} />;
      })}
    </>
  );
}

export function FormatDetailPage() {
  const navigate = useNavigate();
  const { formatId: formatIdParam } = useParams();
  const formatId = normalizeFormatId(formatIdParam);
  const format = formatId ? getFormatById(formatId) : undefined;
  const { state: catalogState } = useCardCatalog();
  const tableViewportOk = useMinViewportWidth(CATALOG_WIDE_LAYOUT_MIN_WIDTH_PX);
  const [viewMode, setViewModeState] = useState<CatalogViewMode>(() => readFormatDetailViewMode());
  const effectiveViewMode = effectiveCatalogViewMode(viewMode, {
    tableAvailable: tableViewportOk,
  });
  const [columnVisibility, setColumnVisibility] = useTableColumnVisibility(
    'format-detail',
    CATALOG_TABLE_TOOLBAR_COLUMNS,
  );
  const catalogColumnVisibility = catalogTableVisibilityFromRecord(columnVisibility);
  const [tcgDatedLoad, setTcgDatedLoad] = useState<{
    effectiveDate: string;
    model: FormatBanlistPageModel | 'loading' | 'missing';
  } | null>(null);

  useEffect(() => {
    if (formatId) {
      writeFormatPreference(formatId);
    }
  }, [formatId]);

  useEffect(() => {
    if (!format || format.banlistSource !== 'tcg-dated-list' || !format.banlistEffectiveDate) {
      return;
    }
    if (catalogState.status !== 'ready') {
      return;
    }
    const effectiveDate = format.banlistEffectiveDate;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setTcgDatedLoad({ effectiveDate, model: 'loading' });
      }
    });
    loadTcgBanlistSnapshotWithPrevious(effectiveDate)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setTcgDatedLoad({ effectiveDate, model: 'missing' });
          return;
        }
        setTcgDatedLoad({
          effectiveDate,
          model: buildTcgDatedFormatBanlistPageModel(
            format,
            result.snapshot,
            result.previousCards,
            catalogState.cards,
          ),
        });
      })
      .catch(() => {
        if (!cancelled) setTcgDatedLoad({ effectiveDate, model: 'missing' });
      });
    return () => {
      cancelled = true;
    };
  }, [catalogState, format]);

  const pageModel = useMemo(() => {
    if (!format || catalogState.status !== 'ready') return null;
    if (format.banlistSource === 'tcg-dated-list') {
      const effectiveDate = format.banlistEffectiveDate;
      if (!effectiveDate || !tcgDatedLoad || tcgDatedLoad.effectiveDate !== effectiveDate) {
        return null;
      }
      if (tcgDatedLoad.model === 'loading') {
        return null;
      }
      if (tcgDatedLoad.model === 'missing') {
        return { effectiveDate, sections: [] };
      }
      return tcgDatedLoad.model;
    }
    return buildFormatBanlistPageModel(format, catalogState.cards);
  }, [catalogState, format, tcgDatedLoad]);

  const detailFacts = useMemo(() => (format ? buildFormatDetailFacts(format) : null), [format]);

  const setViewMode = useCallback((mode: CatalogViewMode) => {
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
  const poolAsSection: FormatBanlistSection | undefined = poolPreview
    ? {
        id: 'speed-duel-pool',
        heading: poolPreview.heading,
        cards: poolPreview.cards,
      }
    : undefined;

  return (
    <PageContainer className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Toolbar
          actions={
            <>
              <ToolbarIconButton
                label="Search card pool"
                onClick={() => {
                  writeFormatPreference(formatId);
                  navigate(searchWithFormatPath(formatId));
                }}
              >
                <SearchIcon />
              </ToolbarIconButton>
              {effectiveViewMode === 'table' ? (
                <TableToolbar
                  variant="inline"
                  columns={CATALOG_TABLE_TOOLBAR_COLUMNS}
                  visibility={columnVisibility}
                  onVisibilityChange={setColumnVisibility}
                />
              ) : null}
              <CatalogViewToggle value={effectiveViewMode} onChange={setViewMode} />
            </>
          }
        >
          <PageTitle>{format.name}</PageTitle>
        </Toolbar>
        {detailFacts ? <FormatDetailFactsBlock facts={detailFacts} formatId={formatId} /> : null}
      </div>

      <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden">
        <FormatBanlistSections
          sections={restrictedSections}
          formatId={formatId}
          viewMode={effectiveViewMode}
          columnVisibility={catalogColumnVisibility}
        />
        {poolAsSection ? (
          <FormatBanlistSections
            sections={[poolAsSection]}
            formatId={formatId}
            viewMode={effectiveViewMode}
            columnVisibility={catalogColumnVisibility}
          />
        ) : null}
      </div>
      {detailFacts ? <FormatDetailSourcesFooter links={detailFacts.sourceLinks} /> : null}
    </PageContainer>
  );
}
