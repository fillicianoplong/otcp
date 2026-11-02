import type { FacetFieldId } from './facets.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';

const STAT_BUCKET_ORDER = ['?', '0', '1-1000', '1001-2000', '2001-3000', '3001+'] as const;

const LEVEL_KIND_ORDER: Record<string, number> = { Level: 0, Rank: 1, Link: 2 };

export type FacetSortContext = {
  setIndex?: SetIndex | null;
};

function levelTokenParts(value: string): { kind: number; num: number } | null {
  const match = /^(Level|Rank|Link)-(\d+)$/.exec(value);
  if (!match) return null;
  return { kind: LEVEL_KIND_ORDER[match[1]] ?? 99, num: Number(match[2]) };
}

function setReleaseSortKey(
  setName: string,
  setIndex: SetIndex | null | undefined,
): { dated: boolean; time: number; name: string } {
  const entry = setIndex?.[setName];
  const raw = entry?.tcgDate?.trim();
  if (raw) {
    const time = Date.parse(raw);
    if (Number.isFinite(time)) {
      return { dated: true, time, name: setName };
    }
  }
  return { dated: false, time: 0, name: setName };
}

export function compareSetFacetOptionValues(
  a: string,
  b: string,
  setIndex: SetIndex | null | undefined,
): number {
  const useReleaseOrder = setIndex != null && Object.keys(setIndex).length > 0;
  if (!useReleaseOrder) {
    return a.localeCompare(b);
  }

  const ka = setReleaseSortKey(a, setIndex);
  const kb = setReleaseSortKey(b, setIndex);
  if (ka.dated !== kb.dated) {
    return ka.dated ? -1 : 1;
  }
  if (ka.dated && kb.dated && ka.time !== kb.time) {
    return kb.time - ka.time;
  }
  return ka.name.localeCompare(kb.name);
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
  context: FacetSortContext = {},
): { value: string; count: number; label?: string }[] {
  const withLabels = options.map((opt) => ({
    ...opt,
    label: opt.label ?? formatFacetOptionLabel(fieldId, opt.value),
  }));

  if (fieldId === 'set') {
    return withLabels.sort((a, b) => {
      const bySet = compareSetFacetOptionValues(a.value, b.value, context.setIndex);
      if (bySet !== 0) return bySet;
      return (a.label ?? a.value).localeCompare(b.label ?? b.value);
    });
  }

  if (fieldId === 'level' || fieldId === 'atk' || fieldId === 'def') {
    return withLabels.sort((a, b) => compareFacetOptionValues(fieldId, a.value, b.value));
  }
  return withLabels.sort(
    (a, b) => b.count - a.count || (a.label ?? a.value).localeCompare(b.label ?? b.value),
  );
}
