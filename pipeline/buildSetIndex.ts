import type { SetIndex } from '../src/shared/schema/setIndex.ts';
import { resolveSetIndexKey } from '../src/shared/schema/setIndexLookup.ts';
import type { YgoCardsetRow } from './fetchCardsets.ts';
import { setDateOverrides } from './setDateOverrides.ts';

export function buildSetIndex(rows: readonly YgoCardsetRow[]): SetIndex {
  const index: SetIndex = {};
  for (const row of rows) {
    const name = row.set_name?.trim();
    if (!name) continue;
    const tcgDate = row.tcg_date?.trim();
    index[name] = {
      ...(tcgDate ? { tcgDate } : {}),
      numOfCards: row.num_of_cards,
    };
  }
  for (const [setName, overrideDate] of Object.entries(setDateOverrides)) {
    const key = resolveSetIndexKey(index, setName);
    const existing = index[key];
    if (existing?.tcgDate) continue;
    const tcgDate = overrideDate.trim();
    if (!tcgDate) continue;
    index[key] = existing ? { ...existing, tcgDate } : { tcgDate };
  }
  return index;
}
