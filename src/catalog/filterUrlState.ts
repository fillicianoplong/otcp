import { formatFacetRangeChipLabel } from './facetRangeLabels.ts';
import { formatFacetOptionLabel } from './facetOptionOrdering.ts';
import { facetDefinitionById, type FacetFieldId } from './facets.ts';
import {
  emptyFilterState,
  normalizeFilterState,
  parseFilterState,
  serializeFilterState,
  type FilterState,
} from './filterEngine.ts';

export const FILTER_QUERY_KEY = 'f';

export function readFilterStateFromParams(params: URLSearchParams): FilterState {
  const raw = params.get(FILTER_QUERY_KEY);
  if (!raw) return emptyFilterState();
  try {
    return parseFilterState(raw);
  } catch {
    return emptyFilterState();
  }
}

function hasActiveFilterSelections(state: FilterState): boolean {
  return Object.values(state.facets).some((selection) => {
    if (!selection) return false;
    return (
      (selection.include?.length ?? 0) > 0 ||
      (selection.exclude?.length ?? 0) > 0 ||
      selection.range?.min != null ||
      selection.range?.max != null
    );
  });
}

export function writeFilterStateToParams(params: URLSearchParams, state: FilterState): void {
  const normalized = normalizeFilterState(state);
  if (!hasActiveFilterSelections(normalized)) {
    params.delete(FILTER_QUERY_KEY);
    return;
  }
  params.set(FILTER_QUERY_KEY, serializeFilterState(normalized));
}

/** Stable string for scroll-restore and grid remount keys. Empty when no filters apply. */
export function filterStateSignature(state: FilterState): string {
  const normalized = normalizeFilterState(state);
  if (!hasActiveFilterSelections(normalized)) return '';
  return serializeFilterState(normalized);
}

export function countActiveFacetSelections(state: FilterState): number {
  let count = 0;
  for (const selection of Object.values(state.facets)) {
    if (!selection) continue;
    count += selection.include?.length ?? 0;
    count += selection.exclude?.length ?? 0;
    if (selection.range?.min != null || selection.range?.max != null) count += 1;
  }
  return count;
}

export type FilterChip = {
  id: string;
  fieldId: FacetFieldId;
  kind: 'include' | 'exclude' | 'mode' | 'range';
  value?: string;
  label: string;
};

export function filterStateToChips(state: FilterState): FilterChip[] {
  const chips: FilterChip[] = [];
  for (const [fieldId, selection] of Object.entries(state.facets) as [
    FacetFieldId,
    FilterState['facets'][FacetFieldId],
  ][]) {
    if (!selection) continue;
    const def = facetDefinitionById(fieldId);
    for (const value of selection.include ?? []) {
      chips.push({
        id: `${fieldId}:include:${value}`,
        fieldId,
        kind: 'include',
        value,
        label: def?.control === 'range' ? formatFacetOptionLabel(fieldId, value) : value,
      });
    }
    for (const value of selection.exclude ?? []) {
      chips.push({
        id: `${fieldId}:exclude:${value}`,
        fieldId,
        kind: 'exclude',
        value,
        label: `Not ${value}`,
      });
    }
    if (selection.range?.min != null || selection.range?.max != null) {
      chips.push({
        id: `${fieldId}:range`,
        fieldId,
        kind: 'range',
        label: formatFacetRangeChipLabel(fieldId, selection.range),
      });
    }
  }
  return chips;
}

export function roundTripFilterQueryParam(state: FilterState): FilterState {
  const params = new URLSearchParams();
  writeFilterStateToParams(params, state);
  const serialized = params.get(FILTER_QUERY_KEY);
  if (!serialized) return emptyFilterState();
  return readFilterStateFromParams(new URLSearchParams([[FILTER_QUERY_KEY, serialized]]));
}
