import type { FacetFieldId } from './facets.ts';

const STAT_BUCKET_ORDER = ['?', '0', '1-1000', '1001-2000', '2001-3000', '3001+'] as const;

const LEVEL_KIND_ORDER: Record<string, number> = { Level: 0, Rank: 1, Link: 2 };

function levelTokenParts(value: string): { kind: number; num: number } | null {
  const match = /^(Level|Rank|Link)-(\d+)$/.exec(value);
  if (!match) return null;
  return { kind: LEVEL_KIND_ORDER[match[1]] ?? 99, num: Number(match[2]) };
}

export function formatFacetOptionLabel(fieldId: FacetFieldId, value: string): string {
  if (fieldId === 'level') {
    const parts = levelTokenParts(value);
    if (parts) {
      const name = Object.keys(LEVEL_KIND_ORDER).find(
        (key) => LEVEL_KIND_ORDER[key] === parts.kind,
      );
      return `${name} ${parts.num}`;
    }
  }
  if (fieldId === 'atk' || fieldId === 'def') {
    if (value === '?') return '?';
    if (value === '0') return '0';
    if (value === '3001+') return '3001+';
    return value.replace('-', '–');
  }
  return value;
}

export function compareFacetOptionValues(fieldId: FacetFieldId, a: string, b: string): number {
  if (fieldId === 'level') {
    const pa = levelTokenParts(a);
    const pb = levelTokenParts(b);
    if (pa && pb) {
      return pa.kind - pb.kind || pa.num - pb.num;
    }
  }
  if (fieldId === 'atk' || fieldId === 'def') {
    const ia = STAT_BUCKET_ORDER.indexOf(a as (typeof STAT_BUCKET_ORDER)[number]);
    const ib = STAT_BUCKET_ORDER.indexOf(b as (typeof STAT_BUCKET_ORDER)[number]);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
  }
  return a.localeCompare(b);
}

export function sortFacetOptionsForDisplay(
  fieldId: FacetFieldId,
  options: readonly { value: string; count: number; label?: string }[],
): { value: string; count: number; label?: string }[] {
  const withLabels = options.map((opt) => ({
    ...opt,
    label: opt.label ?? formatFacetOptionLabel(fieldId, opt.value),
  }));
  if (fieldId === 'level' || fieldId === 'atk' || fieldId === 'def') {
    return withLabels.sort((a, b) => compareFacetOptionValues(fieldId, a.value, b.value));
  }
  return withLabels.sort(
    (a, b) => b.count - a.count || (a.label ?? a.value).localeCompare(b.label ?? b.value),
  );
}
