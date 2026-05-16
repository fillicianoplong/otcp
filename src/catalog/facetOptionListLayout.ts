import type { FacetFieldId } from './facets.ts';

/** Collapsed facet lists show this many options before "Show more". */
export const FACET_COLLAPSED_VISIBLE_COUNT = 8;

/** Option counts at or above this make a group "long" (unless always-long). */
export const FACET_LONG_GROUP_OPTION_THRESHOLD = 12;

export const FACET_OPTION_LIST_SCROLL_CAP_PX = 320;

const ALWAYS_LONG_FACET_FIELD_IDS: ReadonlySet<FacetFieldId> = new Set([
  'set',
  'archetype',
  'cardType',
]);

export function isLongFacetOptionList(fieldId: FacetFieldId, optionCount: number): boolean {
  if (ALWAYS_LONG_FACET_FIELD_IDS.has(fieldId)) return true;
  return optionCount >= FACET_LONG_GROUP_OPTION_THRESHOLD;
}

export function facetOptionListShowsSearch(isLong: boolean): boolean {
  return isLong;
}

export function facetOptionVisibleCount(filteredCount: number, listExpanded: boolean): number {
  if (listExpanded) return filteredCount;
  return Math.min(FACET_COLLAPSED_VISIBLE_COUNT, filteredCount);
}

export function facetOptionShowMoreLess(
  filteredCount: number,
  listExpanded: boolean,
): 'more' | 'less' | null {
  if (filteredCount <= FACET_COLLAPSED_VISIBLE_COUNT) return null;
  return listExpanded ? 'less' : 'more';
}

/** Inner scroll cap applies only to expanded long groups. */
export function facetOptionListUsesInnerScroll(isLong: boolean, listExpanded: boolean): boolean {
  return isLong && listExpanded;
}
