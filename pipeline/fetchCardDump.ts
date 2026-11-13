import { YGOPRODECK_CARDINFO_URL } from './constants.ts';
import { fetchYgoprodeckJson, type YgoprodeckFetchOptions } from './ygoprodeckFetch.ts';
import type { YgoCardinfoResponse } from './ygoprodeckTypes.ts';

export type FetchCardDumpOptions = Omit<YgoprodeckFetchOptions, 'url'> & {
  url?: string;
};

export async function fetchCardDump(
  options: FetchCardDumpOptions = {},
): Promise<YgoCardinfoResponse> {
  const url = options.url ?? YGOPRODECK_CARDINFO_URL;
  const body = await fetchYgoprodeckJson<YgoCardinfoResponse>({ ...options, url });
  if (!body || !Array.isArray(body.data)) {
    throw new Error('YGOPRODeck response missing data array');
  }
  return body;
}
