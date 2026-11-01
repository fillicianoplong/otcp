/** Facet field ids for the shared core layer (any TCG). */
export const CORE_FACET_FIELDS = [
  'cardType',
  'set',
  'rarity',
  'banStatus',
  'price',
  'hasImage',
] as const;

/** Facet field ids declared by the Yu-Gi-Oh! extension. */
export const YUGIOH_FACET_FIELDS = [
  'monsterFrame',
  'attribute',
  'race',
  'archetype',
  'level',
  'atk',
  'def',
  'linkMarker',
] as const;

export const FACET_FIELDS = [...CORE_FACET_FIELDS, ...YUGIOH_FACET_FIELDS] as const;

export type CoreFacetFieldId = (typeof CORE_FACET_FIELDS)[number];
export type YugiohFacetFieldId = (typeof YUGIOH_FACET_FIELDS)[number];
export type FacetFieldId = (typeof FACET_FIELDS)[number];

export type FacetLayer = 'core' | 'yugioh';

export type FacetControlKind = 'multi' | 'range' | 'priceRange' | 'toggle' | 'linkArrows';

export type FacetDefinition = {
  id: FacetFieldId;
  layer: FacetLayer;
  /** Collapsible panel group label (UI binds later). */
  group: string;
  label: string;
  control: FacetControlKind;
  includeExclude: boolean;
  allowAndOr: boolean;
};

/** Shared core facet declarations (SchemaCore / FR-56). */
export const CORE_FACET_DEFINITIONS: readonly FacetDefinition[] = [
  {
    id: 'cardType',
    layer: 'core',
    group: 'Card',
    label: 'Card category / type',
    control: 'multi',
    includeExclude: true,
    allowAndOr: false,
  },
  {
    id: 'set',
    layer: 'core',
    group: 'Printing',
    label: 'Set / expansion',
    control: 'multi',
    includeExclude: true,
    allowAndOr: false,
  },
  {
    id: 'rarity',
    layer: 'core',
    group: 'Printing',
    label: 'Rarity',
    control: 'multi',
    includeExclude: true,
    allowAndOr: false,
  },
  {
    id: 'banStatus',
    layer: 'core',
    group: 'Legality',
    label: 'Format ban status',
    control: 'multi',
    includeExclude: true,
    allowAndOr: false,
  },
  {
    id: 'price',
    layer: 'core',
    group: 'Market',
    label: 'Price range',
    control: 'priceRange',
    includeExclude: false,
    allowAndOr: false,
  },
  {
    id: 'hasImage',
    layer: 'core',
    group: 'Card',
    label: 'Has hosted image',
    control: 'toggle',
    includeExclude: false,
    allowAndOr: false,
  },
];

/** Yu-Gi-Oh! extension facet declarations (ADR-012). */
export const YUGIOH_FACET_DEFINITIONS: readonly FacetDefinition[] = [
  {
    id: 'monsterFrame',
    layer: 'yugioh',
    group: 'Type',
    label: 'Monster card type',
    control: 'multi',
    includeExclude: true,
    allowAndOr: true,
  },
  {
    id: 'attribute',
    layer: 'yugioh',
    group: 'Monster',
    label: 'Attribute',
    control: 'multi',
    includeExclude: true,
    allowAndOr: false,
  },
  {
    id: 'race',
    layer: 'yugioh',
    group: 'Monster',
    label: 'Monster type / race',
    control: 'multi',
    includeExclude: true,
    allowAndOr: false,
  },
  {
    id: 'archetype',
    layer: 'yugioh',
    group: 'Archetype',
    label: 'Archetype',
    control: 'multi',
    includeExclude: true,
    allowAndOr: false,
  },
  {
    id: 'level',
    layer: 'yugioh',
    group: 'Stats',
    label: 'Level / Rank / Link',
    control: 'range',
    includeExclude: false,
    allowAndOr: false,
  },
  {
    id: 'atk',
    layer: 'yugioh',
    group: 'Stats',
    label: 'ATK',
    control: 'range',
    includeExclude: false,
    allowAndOr: false,
  },
  {
    id: 'def',
    layer: 'yugioh',
    group: 'Stats',
    label: 'DEF',
    control: 'range',
    includeExclude: false,
    allowAndOr: false,
  },
  {
    id: 'linkMarker',
    layer: 'yugioh',
    group: 'Link',
    label: 'Link arrows',
    control: 'linkArrows',
    includeExclude: true,
    allowAndOr: false,
  },
];

export function facetDefinitionsForGame(game: 'yugioh'): readonly FacetDefinition[] {
  if (game === 'yugioh') return [...CORE_FACET_DEFINITIONS, ...YUGIOH_FACET_DEFINITIONS];
  return CORE_FACET_DEFINITIONS;
}

export function facetDefinitionById(id: FacetFieldId): FacetDefinition | undefined {
  return facetDefinitionsForGame('yugioh').find((def) => def.id === id);
}
