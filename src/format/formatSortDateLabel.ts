/** Full YYYY-MM-DD from catalog `sortDate`, or null when missing/invalid. */
export function formatCatalogSortDatePrefix(sortDate: string | undefined): string | null {
  if (!sortDate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sortDate);
  if (!match) return null;
  return sortDate;
}
