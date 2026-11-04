import { Link } from 'react-router';

import {
  formatSignedDelta,
  formatTcgBanlistUntilLabel,
  isTcgBanlistInForce,
  listTcgBanlistManifestEntriesNewestFirst,
  tcgBanlistDetailPath,
  tcgBanlistStatusTotals,
  tcgBanlistTotalsDelta,
} from '../format/tcgBanlists.ts';

function TotalsLine({
  totals,
  delta,
}: {
  totals: ReturnType<typeof tcgBanlistStatusTotals>;
  delta: ReturnType<typeof tcgBanlistTotalsDelta>;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-2">
      <span className="whitespace-nowrap tabular-nums">
        Forbidden {totals.forbidden}{' '}
        <span className="text-text-3">({formatSignedDelta(delta.forbidden)})</span>
      </span>
      <span className="whitespace-nowrap tabular-nums">
        Limited {totals.limited}{' '}
        <span className="text-text-3">({formatSignedDelta(delta.limited)})</span>
      </span>
      <span className="whitespace-nowrap tabular-nums">
        Semi-Limited {totals['semi-limited']}{' '}
        <span className="text-text-3">({formatSignedDelta(delta['semi-limited'])})</span>
      </span>
    </div>
  );
}

export function BanlistsPage() {
  const entries = listTcgBanlistManifestEntriesNewestFirst();

  return (
    <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-heading">Banlists</h1>
        <p className="max-w-[70ch] text-sm text-text-2">
          Official TCG Forbidden &amp; Limited Lists from May 7, 2002 through the current list.
        </p>
      </div>

      <ol className="flex min-w-0 flex-col gap-3">
        {entries.map((entry, index) => {
          const previous = entries[index + 1];
          const totals = tcgBanlistStatusTotals(entry);
          const delta = tcgBanlistTotalsDelta(
            totals,
            previous ? tcgBanlistStatusTotals(previous) : undefined,
          );
          const inForce = isTcgBanlistInForce(entry);

          return (
            <li key={entry.effectiveDate}>
              <Link
                to={tcgBanlistDetailPath(entry.effectiveDate)}
                className="block min-w-0 rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-lg font-semibold tabular-nums text-heading">
                    {entry.effectiveDate}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-text-2">
                  {formatTcgBanlistUntilLabel(entry, inForce)}
                </p>
                <TotalsLine totals={totals} delta={delta} />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
