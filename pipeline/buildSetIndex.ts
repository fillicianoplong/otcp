import type { SetIndex } from '../src/shared/schema/setIndex.ts';
import type { YgoCardsetRow } from './fetchCardsets.ts';

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
  return index;
}
