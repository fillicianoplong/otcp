import type { YugiohCard } from '../shared/schema/card.ts';
import {
  catalogTableArchetypeCell,
  catalogTableAtkCell,
  catalogTableAttributeCell,
  catalogTableCardTypeCell,
  catalogTableColumnLabel,
  catalogTableDefCell,
  catalogTableLevelCell,
  catalogTableRaceOrPropertyCell,
} from './catalogTableColumns.ts';
import { FILTER_STATE_VERSION, type FilterState } from './filterEngine.ts';
import { writeFilterStateToParams } from './filterUrlState.ts';
import type { FacetFieldId } from './facets.ts';

export type CardDetailChip = {
  label: string;
  value: string;
};

function isChipValuePresent(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== '—';
}

/** Level column header is "Level"; use Rank or Link when those stats apply. */
export function cardDetailLevelChipLabel(card: YugiohCard): string {
  if (card.linkRating != null) return 'Link';
  if (card.rank != null) return 'Rank';
  return catalogTableColumnLabel('level');
}

const DETAIL_CHIP_FIELDS: {
  labelFor: (card: YugiohCard) => string;
  valueFor: (card: YugiohCard) => string;
}[] = [
  {
    labelFor: () => catalogTableColumnLabel('attribute'),
    valueFor: catalogTableAttributeCell,
  },
  {
    labelFor: () => catalogTableColumnLabel('type'),
    valueFor: catalogTableRaceOrPropertyCell,
  },
  {
    labelFor: cardDetailLevelChipLabel,
    valueFor: catalogTableLevelCell,
  },
  {
    labelFor: () => catalogTableColumnLabel('atk'),
    valueFor: catalogTableAtkCell,
  },
  {
    labelFor: () => catalogTableColumnLabel('def'),
    valueFor: catalogTableDefCell,
  },
  {
    labelFor: () => catalogTableColumnLabel('archetype'),
    valueFor: catalogTableArchetypeCell,
  },
  {
    labelFor: () => catalogTableColumnLabel('cardType'),
    valueFor: catalogTableCardTypeCell,
  },
];

export function buildCardDetailChips(card: YugiohCard): CardDetailChip[] {
  const chips: CardDetailChip[] = [];
  for (const field of DETAIL_CHIP_FIELDS) {
    const value = field.valueFor(card);
    if (!isChipValuePresent(value)) continue;
    chips.push({ label: field.labelFor(card), value });
  }
  return chips;
}

function buildFacetSearchHref(fieldId: FacetFieldId, value: string): string {
  const state: FilterState = {
    version: FILTER_STATE_VERSION,
    facets: { [fieldId]: { include: [value] } },
  };
  const params = new URLSearchParams();
  writeFilterStateToParams(params, state);
  const query = params.toString();
  return query.length > 0 ? `/search?${query}` : '/search';
}

function buildExactRangeSearchHref(fieldId: 'atk' | 'def', value: number): string {
  const state: FilterState = {
    version: FILTER_STATE_VERSION,
    facets: { [fieldId]: { range: { min: value, max: value } } },
  };
  const params = new URLSearchParams();
  writeFilterStateToParams(params, state);
  const query = params.toString();
  return query.length > 0 ? `/search?${query}` : '/search';
}

function statChipSearchHref(
  chip: CardDetailChip,
  fieldId: 'atk' | 'def',
  stat: number | undefined,
): string | null {
  const display = chip.value.trim();
  if (display === '—') return null;
  if (display === '?') {
    if (typeof stat === 'number' && stat < 0) {
      return buildFacetSearchHref(fieldId, '?');
    }
    return null;
  }
  if (typeof stat !== 'number' || stat < 0) return null;
  if (!/^\d+$/.test(display)) return null;
  if (Number(display) !== stat) return null;
  return buildExactRangeSearchHref(fieldId, stat);
}

function raceFacetValueForCard(card: YugiohCard): string | null {
  if (card.type.startsWith('Quick-Play')) return 'Quick-Play';
  const race = card.race?.trim();
  return race && race.length > 0 ? race : null;
}

function levelFacetValueForChip(chip: CardDetailChip, card: YugiohCard): string | null {
  const numeric = chip.value.trim();
  if (!/^\d+$/.test(numeric)) return null;
  if (chip.label === 'Link' && card.linkRating != null) {
    return `Link-${card.linkRating}`;
  }
  if (chip.label === 'Rank' && card.rank != null) {
    return `Rank-${card.rank}`;
  }
  if (chip.label === catalogTableColumnLabel('level') && card.level != null) {
    return `Level-${card.level}`;
  }
  return null;
}

/** Maps a rendered detail chip to a single-facet Search URL, or null when not linkable. */
export function buildCardDetailChipSearchHref(
  chip: CardDetailChip,
  card: YugiohCard,
): string | null {
  const attributeLabel = catalogTableColumnLabel('attribute');
  const typeLabel = catalogTableColumnLabel('type');
  const atkLabel = catalogTableColumnLabel('atk');
  const defLabel = catalogTableColumnLabel('def');
  const archetypeLabel = catalogTableColumnLabel('archetype');
  const cardTypeLabel = catalogTableColumnLabel('cardType');

  if (chip.label === atkLabel) {
    return statChipSearchHref(chip, 'atk', card.atk);
  }

  if (chip.label === defLabel) {
    return statChipSearchHref(chip, 'def', card.def);
  }

  if (chip.label === attributeLabel) {
    const value = card.attribute?.trim();
    return value ? buildFacetSearchHref('attribute', value) : null;
  }

  if (chip.label === typeLabel) {
    const value = raceFacetValueForCard(card);
    return value ? buildFacetSearchHref('race', value) : null;
  }

  if (
    chip.label === 'Link' ||
    chip.label === 'Rank' ||
    chip.label === catalogTableColumnLabel('level')
  ) {
    const value = levelFacetValueForChip(chip, card);
    return value ? buildFacetSearchHref('level', value) : null;
  }

  if (chip.label === archetypeLabel) {
    const value = card.archetype?.trim();
    return value ? buildFacetSearchHref('archetype', value) : null;
  }

  if (chip.label === cardTypeLabel) {
    const value = card.type?.trim();
    return value ? buildFacetSearchHref('cardType', value) : null;
  }

  return null;
}

export function cardDetailChipSearchAriaLabel(chip: CardDetailChip): string {
  return `Search for cards with ${chip.label} ${chip.value}`;
}
