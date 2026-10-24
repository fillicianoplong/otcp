import type { FormatId } from './formatCatalog.ts';

export type FormatFilterSearchOption = {
  id: FormatId | null;
  name: string;
};

export function formatOptionMatchesQuery(
  option: FormatFilterSearchOption,
  normalizedQuery: string,
): boolean {
  const nameMatches = option.name.toLowerCase().includes(normalizedQuery);
  if (option.id === null) {
    return nameMatches || 'none'.includes(normalizedQuery);
  }
  // Single letters match names only. Longer queries also match the format id.
  return nameMatches || (normalizedQuery.length > 1 && option.id.includes(normalizedQuery));
}
