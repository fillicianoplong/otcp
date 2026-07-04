import type { SetIndex, SetIndexEntry } from './setIndex.ts';

export function lookupSetIndexEntry(
  setIndex: SetIndex | null | undefined,
  setName: string,
): SetIndexEntry | undefined {
  if (setIndex == null) {
    return undefined;
  }
  const direct = setIndex[setName];
  if (direct !== undefined) {
    return direct;
  }
  const target = setName.toLowerCase();
  for (const [key, entry] of Object.entries(setIndex)) {
    if (key.toLowerCase() === target) {
      return entry;
    }
  }
  return undefined;
}

/** Prefer an existing index key when set names differ only by letter case. */
export function resolveSetIndexKey(setIndex: SetIndex, setName: string): string {
  if (Object.prototype.hasOwnProperty.call(setIndex, setName)) {
    return setName;
  }
  const target = setName.toLowerCase();
  for (const key of Object.keys(setIndex)) {
    if (key.toLowerCase() === target) {
      return key;
    }
  }
  return setName;
}
