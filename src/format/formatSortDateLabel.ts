const sortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Formats a catalog `sortDate` (YYYY-MM-DD) for muted UI labels, or null when missing/invalid. */
export function formatCatalogSortDateLabel(sortDate: string | undefined): string | null {
  if (!sortDate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sortDate);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = Date.UTC(year, month - 1, day);
  if (!Number.isFinite(time)) return null;
  return sortDateFormatter.format(new Date(time));
}
