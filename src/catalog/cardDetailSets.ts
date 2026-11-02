import { FILTER_STATE_VERSION, type FilterState } from './filterEngine.ts';
import { writeFilterStateToParams } from './filterUrlState.ts';
import { compareSetFacetOptionValues } from './facetOptionOrdering.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

export const CARD_DETAIL_SETS_INITIAL_VISIBLE = 5;

export type CardDetailSetEntry = YugiohCard['sets'][number];

export function sortCardDetailSets(
  sets: readonly CardDetailSetEntry[],
  setIndex?: SetIndex | null,
): CardDetailSetEntry[] {
  const copy = [...sets];
  const useReleaseOrder = setIndex != null && Object.keys(setIndex).length > 0;
  if (!useReleaseOrder) {
    return copy;
  }
  copy.sort((a, b) => compareSetFacetOptionValues(a.setName, b.setName, setIndex));
  return copy;
}

export function cardDetailSetsHeadingCount(totalCount: number): string {
  return `Sets (${totalCount})`;
}

export function cardDetailSetsVisibleCount(totalCount: number, expanded: boolean): number {
  if (totalCount <= CARD_DETAIL_SETS_INITIAL_VISIBLE) {
    return totalCount;
  }
  return expanded ? totalCount : CARD_DETAIL_SETS_INITIAL_VISIBLE;
}

export function cardDetailSetsExpandButtonLabel(totalCount: number): string | null {
  if (totalCount <= CARD_DETAIL_SETS_INITIAL_VISIBLE) {
    return null;
  }
  return `Show all ${totalCount} sets`;
}

export function cardDetailSetsShowCollapseButton(totalCount: number, expanded: boolean): boolean {
  return totalCount > CARD_DETAIL_SETS_INITIAL_VISIBLE && expanded;
}

const setReleaseDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function tcgDateForSetName(setName: string, setIndex: SetIndex | null | undefined): string | null {
  const raw = setIndex?.[setName]?.tcgDate?.trim();
  if (!raw) {
    return null;
  }
  const time = Date.parse(raw);
  if (!Number.isFinite(time)) {
    return null;
  }
  return raw;
}

export function formatCardDetailSetReleaseDate(tcgDate: string): string | null {
  const time = Date.parse(tcgDate.trim());
  if (!Number.isFinite(time)) {
    return null;
  }
  return setReleaseDateFormatter.format(new Date(time));
}

export function cardDetailSetRowSubtitle(
  setCode: string,
  setRarity: string,
  setName?: string,
  setIndex?: SetIndex | null,
): string {
  const parts = [`${setCode} · ${setRarity}`];
  if (setName != null) {
    const tcgDate = tcgDateForSetName(setName, setIndex);
    if (tcgDate != null) {
      const formatted = formatCardDetailSetReleaseDate(tcgDate);
      if (formatted != null) {
        parts.push(formatted);
      }
    }
  }
  return parts.join(' · ');
}

export function buildCardDetailSetSearchHref(setName: string): string {
  const state: FilterState = {
    version: FILTER_STATE_VERSION,
    facets: { set: { include: [setName] } },
  };
  const params = new URLSearchParams();
  writeFilterStateToParams(params, state);
  const query = params.toString();
  return query.length > 0 ? `/search?${query}` : '/search';
}
