import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { PageContainer } from '../ui/PageContainer.tsx';
import { PageTitle } from '../ui/PageTitle.tsx';

import {
  formatBanlistEffectiveDate,
  formatDetailPath,
  listFormatsNewestFirst,
  searchWithFormatPath,
  type FormatDefinition,
  type FormatId,
} from '../format/formatCatalog.ts';
import { writeFormatPreference } from '../format/formatPreference.ts';
import {
  banlistDeltaToneClass,
  formatSignedDelta,
  getPreviousTcgBanlistEffectiveDate,
  getTcgBanlistManifestEntry,
  tcgBanlistStatusTotals,
  tcgBanlistTotalsDelta,
} from '../format/tcgBanlists.ts';

type BanlistRowStats = {
  readonly forbidden: number;
  readonly limited: number;
  readonly semiLimited: number;
  readonly deltaForbidden: number;
  readonly deltaLimited: number;
  readonly deltaSemiLimited: number;
};

function banlistStatsForFormat(format: FormatDefinition): BanlistRowStats | null {
  const effectiveDate = formatBanlistEffectiveDate(format);
  if (!effectiveDate) return null;
  const entry = getTcgBanlistManifestEntry(effectiveDate);
  if (!entry) return null;
  const totals = tcgBanlistStatusTotals(entry);
  const previousDate = getPreviousTcgBanlistEffectiveDate(effectiveDate);
  const previousEntry = previousDate ? getTcgBanlistManifestEntry(previousDate) : undefined;
  const delta = tcgBanlistTotalsDelta(
    totals,
    previousEntry ? tcgBanlistStatusTotals(previousEntry) : undefined,
  );
  return {
    forbidden: totals.forbidden,
    limited: totals.limited,
    semiLimited: totals['semi-limited'],
    deltaForbidden: delta.forbidden,
    deltaLimited: delta.limited,
    deltaSemiLimited: delta['semi-limited'],
  };
}

function BanlistCountCell({ total, delta }: { total: number; delta: number }) {
  return (
    <span className="whitespace-nowrap tabular-nums text-text">
      {total} <span className={banlistDeltaToneClass(delta)}>({formatSignedDelta(delta)})</span>
    </span>
  );
}

const formatsDataRowClassName = 'formats-data-row group/row cursor-pointer hover:bg-surface-2/60';

const formatsRowCellContentClassName = 'relative z-[1] pointer-events-none';

function FormatRowCell({
  formatId,
  className,
  children,
  primary = false,
}: {
  formatId: FormatId;
  className?: string;
  children: ReactNode;
  primary?: boolean;
}) {
  const rememberFormat = () => writeFormatPreference(formatId);

  if (primary) {
    return (
      <td className={`relative ${className ?? ''}`}>
        <Link
          to={formatDetailPath(formatId)}
          data-formats-row-link=""
          onClick={rememberFormat}
          className="font-semibold text-heading underline-offset-2 group-hover/row:underline focus-visible:outline-none"
        >
          <span aria-hidden="true" className="absolute inset-0 z-0" />
          <span className="relative z-[1]">{children}</span>
        </Link>
      </td>
    );
  }

  return (
    <td className={`relative ${className ?? ''}`}>
      <Link
        to={formatDetailPath(formatId)}
        data-formats-row-hit=""
        tabIndex={-1}
        aria-hidden="true"
        onClick={rememberFormat}
        className="absolute inset-0 z-0"
      />
      <span className={formatsRowCellContentClassName}>{children}</span>
    </td>
  );
}

export function FormatsPage() {
  const formats = listFormatsNewestFirst();

  return (
    <PageContainer className="flex flex-col gap-6 overflow-x-hidden">
      <div className="flex flex-col gap-2">
        <PageTitle>Formats</PageTitle>
        <p className="max-w-[70ch] text-sm text-text-2">
          Every Format Library era and TCG Forbidden &amp; Limited list is playable here. Pick a row
          to open banlist details and search the matching card pool.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-surface-2 text-text-2">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                Format
              </th>
              <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                List date
              </th>
              <th scope="col" className="py-2 pr-3 pl-1 font-medium whitespace-nowrap">
                Pool through
              </th>
              <th scope="col" className="hidden px-3 py-2 font-medium lg:table-cell">
                Forbidden
              </th>
              <th scope="col" className="hidden px-3 py-2 font-medium lg:table-cell">
                Limited
              </th>
              <th scope="col" className="hidden px-3 py-2 font-medium lg:table-cell">
                Semi-Limited
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {formats.map((format) => {
              const listDate = formatBanlistEffectiveDate(format) ?? '';
              const stats = banlistStatsForFormat(format);
              const poolThrough =
                format.poolCutoffDate ??
                (format.poolRule === 'full-tcg' || format.poolRule === 'speed-duel-ygoprodeck'
                  ? 'Full TCG'
                  : '');

              return (
                <tr key={format.id} className={formatsDataRowClassName}>
                  <FormatRowCell formatId={format.id} primary className="px-3 py-2">
                    {format.name}
                  </FormatRowCell>
                  <FormatRowCell
                    formatId={format.id}
                    className="px-3 py-2 pr-1 tabular-nums text-text whitespace-nowrap"
                  >
                    {listDate || '—'}
                  </FormatRowCell>
                  <FormatRowCell
                    formatId={format.id}
                    className="py-2 pr-3 pl-1 tabular-nums text-text-2 whitespace-nowrap"
                  >
                    {poolThrough || '—'}
                  </FormatRowCell>
                  <FormatRowCell
                    formatId={format.id}
                    className="hidden px-3 py-2 text-xs lg:table-cell"
                  >
                    {stats ? (
                      <BanlistCountCell total={stats.forbidden} delta={stats.deltaForbidden} />
                    ) : (
                      '—'
                    )}
                  </FormatRowCell>
                  <FormatRowCell
                    formatId={format.id}
                    className="hidden px-3 py-2 text-xs lg:table-cell"
                  >
                    {stats ? (
                      <BanlistCountCell total={stats.limited} delta={stats.deltaLimited} />
                    ) : (
                      '—'
                    )}
                  </FormatRowCell>
                  <FormatRowCell
                    formatId={format.id}
                    className="hidden px-3 py-2 text-xs lg:table-cell"
                  >
                    {stats ? (
                      <BanlistCountCell total={stats.semiLimited} delta={stats.deltaSemiLimited} />
                    ) : (
                      '—'
                    )}
                  </FormatRowCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-text-2">
        Tip: use{' '}
        <Link to={searchWithFormatPath('advanced')} className="text-heading underline">
          Search
        </Link>{' '}
        with a format filter, or open any format above for the full banlist grid.
      </p>
    </PageContainer>
  );
}
