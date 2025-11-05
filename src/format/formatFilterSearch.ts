import type { FormatId } from './formatCatalog.ts';

export type FormatFilterSearchOption = {
  id: FormatId | null;
  name: string;
};

export function formatOptionMatchesQuery(
  option: FormatFilterSearchOption,
  normalizedQuery: string,
): boolean {
  if (option.id === null) {
    return 'none'.includes(normalizedQuery);
  }
  return option.name.toLowerCase().includes(normalizedQuery) || option.id.includes(normalizedQuery);
}
