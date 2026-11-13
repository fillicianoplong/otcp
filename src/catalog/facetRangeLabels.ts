import type { FacetFieldId } from './facets.ts';
import type { FacetNumericRange } from './filterEngine.ts';

const EN_DASH = '–';

function formatPriceAmount(value: number): string {
  return value % 1 === 0 ? `$${value}` : `$${value.toFixed(2)}`;
}

export function formatFacetRangeChipLabel(fieldId: FacetFieldId, range: FacetNumericRange): string {
  if (fieldId === 'price') {
    if (range.min != null && range.max != null) {
      return `Price ${formatPriceAmount(range.min)}${EN_DASH}${formatPriceAmount(range.max)}`;
    }
    if (range.max != null) return `Price ≤ ${formatPriceAmount(range.max)}`;
    if (range.min != null) return `Price ≥ ${formatPriceAmount(range.min)}`;
    return 'Price';
  }

  const label =
    fieldId === 'level' ? 'Level' : fieldId === 'atk' ? 'ATK' : fieldId === 'def' ? 'DEF' : fieldId;

  if (range.min != null && range.max != null) {
    return `${label} ${range.min}${EN_DASH}${range.max}`;
  }
  if (range.max != null) return `${label} ≤ ${range.max}`;
  if (range.min != null) return `${label} ≥ ${range.min}`;
  return label;
}
