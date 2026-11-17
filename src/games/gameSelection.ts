import type { FacetFieldId } from '../catalog/facets.ts';
import type { FilterState } from '../catalog/filterEngine.ts';
import type { FormatId } from '../format/formatCatalog.ts';
import { DEFAULT_GAME_ID, resolveGame } from './registry.ts';
import type { GameDefinition, GameId } from './types.ts';

/** Omitted when Yu-Gi-Oh! is selected, so existing search URLs stay the same. */
export const GAME_QUERY_KEY = 'game';

export function readGameIdFromParams(params: URLSearchParams): GameId {
  return resolveGame(params.get(GAME_QUERY_KEY)).id;
}

export function writeGameIdToParams(params: URLSearchParams, gameId: GameId): void {
  const resolved = resolveGame(gameId);
  if (resolved.id === DEFAULT_GAME_ID) {
    params.delete(GAME_QUERY_KEY);
    return;
  }
  params.set(GAME_QUERY_KEY, resolved.id);
}

/**
 * The default game is the baseline. It does not add a Filters badge count.
 * Callers pass a resolved id; an unknown URL param is resolved to the default first.
 */
export function gameCountsAsFilter(gameId: GameId | null | undefined): boolean {
  if (typeof gameId !== 'string') return false;
  return gameId.trim().toLowerCase() !== DEFAULT_GAME_ID;
}

/** Drops facet keys the selected game does not declare. Yu-Gi-Oh! keeps every key. */
export function filterStateForGame(state: FilterState, game: GameDefinition): FilterState {
  const allowed = new Set(game.facetDefinitions.map((definition) => definition.id));
  const facets: FilterState['facets'] = {};
  for (const [fieldId, selection] of Object.entries(state.facets) as [
    FacetFieldId,
    FilterState['facets'][FacetFieldId],
  ][]) {
    if (!selection || !allowed.has(fieldId)) continue;
    facets[fieldId] = selection;
  }
  return { version: state.version, facets };
}

/** Keeps the format when the selected game's catalog includes it. */
export function formatIdForGame(
  formatId: FormatId | null | undefined,
  game: GameDefinition,
): FormatId | null {
  if (!formatId) return null;
  return game.isKnownFormatId(formatId) ? formatId : null;
}
