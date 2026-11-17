import { gameCountsAsFilter } from '../games/gameSelection.ts';
import type { GameId } from '../games/types.ts';
import { countActiveFacetSelections } from './filterUrlState.ts';
import type { FilterState } from './filterEngine.ts';

/**
 * Badge count for the Filters control. The default game is omitted so Yu-Gi-Oh!
 * does not add a count on its own. Sort lives on the results toolbar, not here.
 */
export function countListedFilters(options: {
  filterState: FilterState;
  formatSelected: boolean;
  gameId: GameId;
}): number {
  return (
    countActiveFacetSelections(options.filterState) +
    (options.formatSelected ? 1 : 0) +
    (gameCountsAsFilter(options.gameId) ? 1 : 0)
  );
}
