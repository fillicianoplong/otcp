import type { FacetFieldId } from './facets.ts';
import {
  emptyFilterState,
  type FacetMatchMode,
  type FacetValueSelection,
  type FilterState,
} from './filterEngine.ts';

function cloneState(state: FilterState): FilterState {
  const facets: FilterState['facets'] = {};
  for (const [key, selection] of Object.entries(state.facets)) {
    if (!selection) continue;
    facets[key as FacetFieldId] = {
      include: selection.include ? [...selection.include] : undefined,
      exclude: selection.exclude ? [...selection.exclude] : undefined,
      mode: selection.mode,
    };
  }
  return { version: state.version, facets };
}

function ensureSelection(state: FilterState, fieldId: FacetFieldId): FacetValueSelection {
  const existing = state.facets[fieldId];
  if (existing) {
    return {
      include: existing.include ? [...existing.include] : undefined,
      exclude: existing.exclude ? [...existing.exclude] : undefined,
      mode: existing.mode,
    };
  }
  return {};
}

function commitSelection(
  state: FilterState,
  fieldId: FacetFieldId,
  selection: FacetValueSelection,
): FilterState {
  const next = cloneState(state);
  const hasInclude = (selection.include?.length ?? 0) > 0;
  const hasExclude = (selection.exclude?.length ?? 0) > 0;
  const hasMode = selection.mode === 'and';
  if (!hasInclude && !hasExclude && !hasMode) {
    delete next.facets[fieldId];
    return next;
  }
  next.facets[fieldId] = selection;
  return next;
}

export function toggleIncludeValue(
  state: FilterState,
  fieldId: FacetFieldId,
  value: string,
): FilterState {
  const selection = ensureSelection(state, fieldId);
  const include = new Set(selection.include ?? []);
  const exclude = new Set(selection.exclude ?? []);
  if (include.has(value)) {
    include.delete(value);
  } else {
    include.add(value);
    exclude.delete(value);
  }
  selection.include = include.size > 0 ? [...include] : undefined;
  selection.exclude = exclude.size > 0 ? [...exclude] : undefined;
  return commitSelection(state, fieldId, selection);
}

export function toggleExcludeValue(
  state: FilterState,
  fieldId: FacetFieldId,
  value: string,
): FilterState {
  const selection = ensureSelection(state, fieldId);
  const include = new Set(selection.include ?? []);
  const exclude = new Set(selection.exclude ?? []);
  if (exclude.has(value)) {
    exclude.delete(value);
  } else {
    exclude.add(value);
    include.delete(value);
  }
  selection.include = include.size > 0 ? [...include] : undefined;
  selection.exclude = exclude.size > 0 ? [...exclude] : undefined;
  return commitSelection(state, fieldId, selection);
}

export function setFacetMatchMode(
  state: FilterState,
  fieldId: FacetFieldId,
  mode: FacetMatchMode,
): FilterState {
  const selection = ensureSelection(state, fieldId);
  selection.mode = mode === 'or' ? undefined : mode;
  return commitSelection(state, fieldId, selection);
}

export function removeFilterChip(
  state: FilterState,
  chip: {
    fieldId: FacetFieldId;
    kind: 'include' | 'exclude' | 'mode';
    value?: string;
  },
): FilterState {
  const selection = ensureSelection(state, chip.fieldId);
  if (chip.kind === 'mode') {
    selection.mode = undefined;
    return commitSelection(state, chip.fieldId, selection);
  }
  if (chip.kind === 'include' && chip.value) {
    const include = new Set(selection.include ?? []);
    include.delete(chip.value);
    selection.include = include.size > 0 ? [...include] : undefined;
  }
  if (chip.kind === 'exclude' && chip.value) {
    const exclude = new Set(selection.exclude ?? []);
    exclude.delete(chip.value);
    selection.exclude = exclude.size > 0 ? [...exclude] : undefined;
  }
  return commitSelection(state, chip.fieldId, selection);
}

export function clearAllFilters(): FilterState {
  return emptyFilterState();
}
