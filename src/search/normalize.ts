/** Case- and accent-insensitive text for search matching (FR-01, FR-02). */
export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}
