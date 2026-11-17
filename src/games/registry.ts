import { SEARCH_FACET_FIELD_ORDER, facetDefinitionsForGame } from '../catalog/facets.ts';
import { isKnownFormatId, listFormatsNewestFirst } from '../format/formatCatalog.ts';
import { normalizeYugiohCardLevelRankLink } from '../shared/schema/normalizeMonsterLevelRankLink.ts';
import type { GameDefinition, GameId } from './types.ts';
import {
  YUGIOH_FIELD_INDEXERS,
  monsterFrameFacetValues,
  yugiohBanStatusValue,
  yugiohRowMatchesLevelTokens,
  yugiohRowMatchesRange,
} from './yugiohCardFacets.ts';

/** The only game shipped today. Search starts here, and the URL omits it. */
export const YUGIOH_GAME_ID = 'yugioh' as const;

export const DEFAULT_GAME_ID: GameId = YUGIOH_GAME_ID;

/**
 * Yu-Gi-Oh! owns the facet declarations, the format catalog, and the card
 * queries the filter engine used to hardcode. A later game is another entry.
 */
export const YUGIOH_GAME: GameDefinition = {
  id: YUGIOH_GAME_ID,
  name: 'Yu-Gi-Oh!',
  facetDefinitions: facetDefinitionsForGame('yugioh'),
  facetFieldOrder: SEARCH_FACET_FIELD_ORDER,
  fieldIndexers: YUGIOH_FIELD_INDEXERS,
  rangeFieldIds: ['price', 'atk', 'def', 'level'],
  skipBitsetUnionFieldIds: ['price'],
  listFormatsNewestFirst,
  isKnownFormatId,
  prepareCard: normalizeYugiohCardLevelRankLink,
  rowMatchesRange: yugiohRowMatchesRange,
  frameKeyword: {
    fieldId: 'monsterFrame',
    rowHas: (card, keyword) => monsterFrameFacetValues(card).includes(keyword),
  },
  levelTokens: {
    fieldId: 'level',
    rowMatches: yugiohRowMatchesLevelTokens,
  },
  banStatusValue: yugiohBanStatusValue,
};

export const GAME_REGISTRY: readonly GameDefinition[] = [YUGIOH_GAME];

const gameById = new Map<string, GameDefinition>(GAME_REGISTRY.map((game) => [game.id, game]));

export function listGames(): readonly GameDefinition[] {
  return GAME_REGISTRY;
}

export function getGame(id: GameId | null | undefined): GameDefinition | undefined {
  if (typeof id !== 'string') return undefined;
  return gameById.get(id.trim().toLowerCase());
}

/** Unknown ids fall back to Yu-Gi-Oh! so a stray param cannot blank the catalog. */
export function resolveGame(id: GameId | null | undefined): GameDefinition {
  return getGame(id) ?? YUGIOH_GAME;
}

export function isDefaultGame(id: GameId | null | undefined): boolean {
  return resolveGame(id).id === DEFAULT_GAME_ID;
}

/**
 * The selected game's filters and formats. The panel and the engine both read this
 * so a second registry entry swaps the groups below Game without a UI rewrite.
 */
export function gameFilterModel(game: GameDefinition): {
  facetDefinitions: GameDefinition['facetDefinitions'];
  formats: ReturnType<GameDefinition['listFormatsNewestFirst']>;
} {
  return {
    facetDefinitions: game.facetDefinitions,
    formats: game.listFormatsNewestFirst(),
  };
}
