import { describe, expect, it } from 'vitest';

import sampleDataset from '../../public/data/datasets/sample-dev.json';
import { countListedFilters } from '../../src/catalog/activeFilterCount.ts';
import { facetDefinitionsForGame } from '../../src/catalog/facets.ts';
import {
  FilterEngine,
  emptyFilterState,
  serializeFilterState,
  type FilterState,
} from '../../src/catalog/filterEngine.ts';
import {
  FILTER_QUERY_KEY,
  filterStateSignature,
  writeFilterStateToParams,
} from '../../src/catalog/filterUrlState.ts';
import { FORMAT_CATALOG, listFormatsNewestFirst } from '../../src/format/formatCatalog.ts';
import {
  GAME_QUERY_KEY,
  filterStateForGame,
  formatIdForGame,
  gameCountsAsFilter,
  readGameIdFromParams,
  writeGameIdToParams,
} from '../../src/games/gameSelection.ts';
import {
  DEFAULT_GAME_ID,
  YUGIOH_GAME,
  gameFilterModel,
  listGames,
} from '../../src/games/registry.ts';
import { YUGIOH_FIELD_INDEXERS } from '../../src/games/yugiohCardFacets.ts';
import type { GameDefinition } from '../../src/games/types.ts';
import type { FormatDefinition } from '../../src/format/formatCatalog.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

const sampleCards = sampleDataset.cards as YugiohCard[];

const SAVED_DARK_FILTER: FilterState = {
  version: 1,
  facets: { attribute: { include: ['DARK'] } },
};

const DEMO_FORMAT: FormatDefinition = {
  id: 'demo-format',
  name: 'Demo Format',
  cardSubtitle: 'Demo',
  banlistHeading: 'Demo list',
  deckRulesSummary: 'Main 40',
  poolRule: 'full-tcg',
  banlistSource: 'tcg-current',
  traditionalForbiddenAsLimited: false,
};

const DEMO_GAME: GameDefinition = {
  id: 'demo',
  name: 'Demo TCG',
  facetDefinitions: YUGIOH_GAME.facetDefinitions.filter(
    (definition) => definition.id === 'cardType',
  ),
  facetFieldOrder: ['cardType'],
  fieldIndexers: YUGIOH_FIELD_INDEXERS.filter((indexer) => indexer.id === 'cardType'),
  rangeFieldIds: [],
  skipBitsetUnionFieldIds: [],
  listFormatsNewestFirst: () => [DEMO_FORMAT],
  isKnownFormatId: (id) => id === DEMO_FORMAT.id,
  prepareCard: (card) => card,
  rowMatchesRange: () => true,
  banStatusValue: () => 'Unlimited',
};

function snapshot(engine: FilterEngine, state: FilterState, formatParam?: string) {
  const options = formatParam ? { formatParam } : {};
  return {
    apply: engine.apply(state, options),
    recount: engine.recount(state, options),
    fields: engine.fieldsWithCatalog(),
  };
}

describe('game registry', () => {
  it('ships Yu-Gi-Oh! as the only game and the default', () => {
    expect(listGames().map((game) => game.id)).toEqual(['yugioh']);
    expect(listGames()[0]?.name).toBe('Yu-Gi-Oh!');
    expect(DEFAULT_GAME_ID).toBe('yugioh');
    expect(gameFilterModel(YUGIOH_GAME).facetDefinitions).toEqual(
      facetDefinitionsForGame('yugioh'),
    );
    expect(gameFilterModel(YUGIOH_GAME).formats.map((format) => format.id)).toEqual(
      listFormatsNewestFirst().map((format) => format.id),
    );
    expect(YUGIOH_GAME.listFormatsNewestFirst()).toHaveLength(FORMAT_CATALOG.length);
  });

  it('keeps Yu-Gi-Oh! search results and counts identical to the default engine', () => {
    const baseline = new FilterEngine(sampleCards);
    const fromRegistry = new FilterEngine(sampleCards, YUGIOH_GAME);
    const level: FilterState = {
      version: 1,
      facets: { level: { include: ['4'], range: { min: 4, max: 4 } } },
    };
    const frame: FilterState = {
      version: 1,
      facets: { monsterFrame: { include: ['Effect'], exclude: ['Fusion'] } },
    };

    expect(snapshot(fromRegistry, emptyFilterState())).toEqual(
      snapshot(baseline, emptyFilterState()),
    );
    expect(snapshot(fromRegistry, SAVED_DARK_FILTER)).toEqual(
      snapshot(baseline, SAVED_DARK_FILTER),
    );
    expect(snapshot(fromRegistry, SAVED_DARK_FILTER, 'advanced')).toEqual(
      snapshot(baseline, SAVED_DARK_FILTER, 'advanced'),
    );
    expect(snapshot(fromRegistry, level, 'advanced')).toEqual(
      snapshot(baseline, level, 'advanced'),
    );
    expect(snapshot(fromRegistry, frame)).toEqual(snapshot(baseline, frame));
    expect(fromRegistry.fieldsWithCatalog()).toEqual(baseline.fieldsWithCatalog());
  });

  it('swaps the indexed fields and the format catalog for another game', () => {
    const yugioh = new FilterEngine(sampleCards, YUGIOH_GAME);
    const demo = new FilterEngine(sampleCards, DEMO_GAME);
    const yugiohType = yugioh
      .recount(emptyFilterState())
      .find((group) => group.fieldId === 'cardType');

    expect(gameFilterModel(DEMO_GAME).facetDefinitions.map((definition) => definition.id)).toEqual([
      'cardType',
    ]);
    expect(gameFilterModel(DEMO_GAME).formats.map((format) => format.id)).toEqual(['demo-format']);
    expect(demo.definitions.map((definition) => definition.id)).toEqual(['cardType']);
    expect(demo.recount(emptyFilterState()).map((group) => group.fieldId)).toEqual(['cardType']);
    expect(demo.recount(emptyFilterState())[0]).toEqual(yugiohType);
    expect(demo.apply(emptyFilterState()).ids).toEqual(yugioh.apply(emptyFilterState()).ids);
    expect(formatIdForGame('advanced', DEMO_GAME)).toBeNull();
    expect(formatIdForGame('demo-format', DEMO_GAME)).toBe('demo-format');
    expect(filterStateForGame(SAVED_DARK_FILTER, DEMO_GAME)).toEqual(emptyFilterState());
    expect(filterStateForGame(SAVED_DARK_FILTER, YUGIOH_GAME)).toEqual(SAVED_DARK_FILTER);
  });

  it('leaves URL params and saved filter JSON unchanged for the default game', () => {
    const params = new URLSearchParams();
    writeFilterStateToParams(params, SAVED_DARK_FILTER);
    params.set('format', 'advanced');
    params.set('q', 'mage');
    const before = params.toString();

    writeGameIdToParams(params, 'yugioh');

    expect(params.toString()).toBe(before);
    expect(params.has(GAME_QUERY_KEY)).toBe(false);
    expect(readGameIdFromParams(params)).toBe('yugioh');
    expect(params.get(FILTER_QUERY_KEY)).toBe(serializeFilterState(SAVED_DARK_FILTER));
    expect(filterStateSignature(SAVED_DARK_FILTER)).toBe(
      '{"version":1,"facets":{"attribute":{"include":["DARK"]}}}',
    );
    expect(filterStateSignature(SAVED_DARK_FILTER).includes('game')).toBe(false);
    expect(readGameIdFromParams(new URLSearchParams())).toBe('yugioh');
    expect(readGameIdFromParams(new URLSearchParams('game=nope'))).toBe('yugioh');
  });

  it('does not count the default game toward the Filters badge', () => {
    expect(gameCountsAsFilter('yugioh')).toBe(false);
    expect(gameCountsAsFilter(undefined)).toBe(false);
    expect(gameCountsAsFilter('demo')).toBe(true);
    expect(
      countListedFilters({
        filterState: SAVED_DARK_FILTER,
        formatSelected: true,
        gameId: 'yugioh',
      }),
    ).toBe(2);
    expect(
      countListedFilters({
        filterState: SAVED_DARK_FILTER,
        formatSelected: true,
        gameId: 'demo',
      }),
    ).toBe(3);
  });
});
