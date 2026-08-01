import { useMemo } from 'react';
import { Link } from 'react-router';

import { formatCardCount } from '../catalog/formatCardCount.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import {
  formatDetailPath,
  listFormatsNewestFirst,
  type FormatDefinition,
} from '../format/formatCatalog.ts';
import { formatCatalogSortDateLabel } from '../format/formatSortDateLabel.ts';
import { writeFormatPreference } from '../format/formatPreference.ts';

function FormatCatalogCard({ format, poolCount }: { format: FormatDefinition; poolCount: number }) {
  const dateLabel = formatCatalogSortDateLabel(format.sortDate);
  const selectFormat = () => {
    writeFormatPreference(format.id);
  };

  return (
    <li>
      <Link
        to={formatDetailPath(format.id)}
        onClick={selectFormat}
        className="flex min-h-[var(--touch-min)] flex-col gap-1 rounded-md border border-border bg-surface px-4 py-4 text-heading transition-colors hover:border-border-strong hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
      >
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg font-semibold">{format.name}</span>
          {dateLabel ? <span className="text-xs tabular-nums text-text-2">{dateLabel}</span> : null}
        </span>
        <span className="text-sm text-text-2">{format.cardSubtitle}</span>
        <span className="mt-1 text-xs text-text-2">{formatCardCount(poolCount)}</span>
      </Link>
    </li>
  );
}

export function FormatsPage() {
  const { state: catalogState } = useCardCatalog();

  const poolCount = useMemo(() => {
    if (catalogState.status !== 'ready') return null;
    return catalogState.cards.length;
  }, [catalogState]);

  const formats = listFormatsNewestFirst();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-heading">Formats</h1>
        <p className="text-sm text-text-2">
          Must formats for v1. Open one for the banlist or points summary.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {formats.map((format) => (
          <FormatCatalogCard key={format.id} format={format} poolCount={poolCount ?? 0} />
        ))}
      </ul>

      {catalogState.status === 'loading' ? (
        <p className="text-sm text-text-2" role="status">
          Loading card counts…
        </p>
      ) : null}
    </div>
  );
}
