import { YGOPRODECK_CARDSETS_URL } from './constants.ts';
import { fetchYgoprodeckJson, type YgoprodeckFetchOptions } from './ygoprodeckFetch.ts';

export type YgoCardsetRow = {
  set_name: string;
  set_code: string;
  num_of_cards: number;
  tcg_date?: string;
};

export type FetchCardsetsOptions = Omit<YgoprodeckFetchOptions, 'url'> & {
  url?: string;
};

export async function fetchCardsets(options: FetchCardsetsOptions = {}): Promise<YgoCardsetRow[]> {
  const url = options.url ?? YGOPRODECK_CARDSETS_URL;
  const body = await fetchYgoprodeckJson<unknown>({ ...options, url });
  if (!Array.isArray(body)) {
    throw new Error('YGOPRODeck cardsets response was not an array');
  }
  return body as YgoCardsetRow[];
}
