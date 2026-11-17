import type { FacetDefinition, FacetFieldId } from '../catalog/facets.ts';
import type { FormatDefinition } from '../format/formatCatalog.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

/** Stable id for a product line. The registry is the list of known ids. */
export type GameId = string;

export type GameNumericRange = {
  min?: number;
  max?: number;
};

/** How one facet field reads values off a card. The engine builds bitsets from this. */
export type FacetFieldIndexer = {
  id: FacetFieldId;
  valuesForRow: (card: YugiohCard) => readonly string[];
  /** Defaults to localeCompare. Level uses numeric order. */
  compareValues?: (left: string, right: string) => number;
};

/**
 * One product line: the filters under Game, the format list, and the card
 * queries FilterEngine needs. Adding a game is a new entry, not a panel rewrite.
 */
export type GameDefinition = {
  readonly id: GameId;
  readonly name: string;
  readonly facetDefinitions: readonly FacetDefinition[];
  /** Panel order for this game's facet groups, below Format. */
  readonly facetFieldOrder: readonly FacetFieldId[];
  readonly fieldIndexers: readonly FacetFieldIndexer[];
  /** Custom min/max fields. Included in the panel even when they have no buckets. */
  readonly rangeFieldIds: readonly FacetFieldId[];
  /** Include values on these fields are not inverted bitsets (price is range-only). */
  readonly skipBitsetUnionFieldIds: readonly FacetFieldId[];
  readonly listFormatsNewestFirst: () => readonly FormatDefinition[];
  readonly isKnownFormatId: (id: string | null | undefined) => boolean;
  readonly prepareCard: (card: YugiohCard) => YugiohCard;
  readonly rowMatchesRange: (
    card: YugiohCard,
    fieldId: FacetFieldId,
    range: GameNumericRange,
  ) => boolean;
  readonly frameKeyword?: {
    readonly fieldId: FacetFieldId;
    readonly rowHas: (card: YugiohCard, keyword: string) => boolean;
  };
  readonly levelTokens?: {
    readonly fieldId: FacetFieldId;
    readonly rowMatches: (card: YugiohCard, tokens: readonly string[]) => boolean;
  };
  readonly banStatusValue: (card: YugiohCard, formatId: string) => string;
};
