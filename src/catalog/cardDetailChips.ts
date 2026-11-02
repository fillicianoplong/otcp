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
