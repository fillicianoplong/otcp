import { Link } from 'react-router';

import {
  formatBanlistEffectiveDate,
  formatDetailPath,
  isCoreFormatId,
  listFormatsNewestFirst,
  searchWithFormatPath,
  type FormatDefinition,
} from '../format/formatCatalog.ts';
import { writeFormatPreference } from '../format/formatPreference.ts';
import {
  formatSignedDelta,
  getPreviousTcgBanlistEffectiveDate,
  getTcgBanlistManifestEntry,
  tcgBanlistStatusTotals,
  tcgBanlistTotalsDelta,
} from '../format/tcgBanlists.ts';

function banlistCountsForFormat(format: FormatDefinition): string | null {
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
  return `F ${totals.forbidden} (${formatSignedDelta(delta.forbidden)})  L ${totals.limited} (${formatSignedDelta(delta.limited)})  S ${totals['semi-limited']} (${formatSignedDelta(delta['semi-limited'])})`;
}

export function FormatsPage() {
  const formats = listFormatsNewestFirst();

  return (
    <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-heading">Formats</h1>
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
              <th scope="col" className="hidden px-3 py-2 font-medium lg:table-cell">
                Banlist (F / L / S)
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Pool through
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {formats.map((format) => {
              const listDate = formatBanlistEffectiveDate(format) ?? format.sortDate ?? '';
              const counts = banlistCountsForFormat(format);
              const poolThrough =
                format.poolCutoffDate ??
                (format.poolRule === 'full-tcg' || format.poolRule === 'speed-duel-ygoprodeck'
                  ? 'Full TCG'
                  : '');

              return (
                <tr key={format.id} className="hover:bg-surface-2/60">
                  <td className="px-3 py-2">
                    <Link
                      to={formatDetailPath(format.id)}
                      onClick={() => writeFormatPreference(format.id)}
                      className="font-semibold text-heading underline-offset-2 hover:underline"
                    >
                      {format.name}
                    </Link>
                    {!isCoreFormatId(format.id) ? (
                      <span className="ml-2 text-xs text-text-3">Meta</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-text">{listDate || '—'}</td>
                  <td className="hidden px-3 py-2 text-xs text-text-2 lg:table-cell">
                    {counts ?? '—'}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-text-2">{poolThrough || '—'}</td>
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
    </div>
  );
}
