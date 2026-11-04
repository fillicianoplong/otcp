import { formatCatalogSortDatePrefix } from './formatSortDateLabel.ts';

type FormatCatalogNameLabelProps = {
  name: string;
  sortDate?: string;
  /** Primary name styling (filter row vs formats grid title). */
  nameClassName?: string;
};

const DATE_PREFIX_CLASS =
  'inline-block w-[10ch] shrink-0 text-right text-xs tabular-nums text-text-2';

export function formatCatalogOptionAriaLabel(name: string, sortDate?: string): string {
  const datePrefix = formatCatalogSortDatePrefix(sortDate);
  return datePrefix ? `${datePrefix} · ${name}` : name;
}

export function FormatCatalogNameLabel({
  name,
  sortDate,
  nameClassName = '',
}: FormatCatalogNameLabelProps) {
  const datePrefix = formatCatalogSortDatePrefix(sortDate);

  if (!datePrefix) {
    return <span className={`truncate ${nameClassName}`.trim()}>{name}</span>;
  }

  return (
    <span className="flex min-w-0 flex-1 items-baseline gap-1 truncate">
      <span className={DATE_PREFIX_CLASS}>{datePrefix}</span>
      <span className="shrink-0 text-xs text-text-2" aria-hidden="true">
        ·
      </span>
      <span className={`truncate ${nameClassName}`.trim()}>{name}</span>
    </span>
  );
}
