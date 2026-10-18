import type { YgoApiCard } from '../../pipeline/ygoprodeckTypes.ts';

const YGO_CARDINFO_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

const artIdsByPasscode = new Map<number, readonly number[]>();
const inflightByPasscode = new Map<number, Promise<readonly number[] | undefined>>();

export function readCachedYgoproArtIds(passcode: number): readonly number[] | undefined {
  return artIdsByPasscode.get(passcode);
}

export function mapYgoproArtIds(row: Pick<YgoApiCard, 'id' | 'card_images'>): readonly number[] {
  const ordered: number[] = [];
  const seen = new Set<number>();
  for (const image of row.card_images ?? [{ id: row.id }]) {
    if (seen.has(image.id)) continue;
    seen.add(image.id);
    ordered.push(image.id);
  }
  if (ordered.length === 0) return [row.id];
  return ordered;
}

function cacheArtIds(passcode: number, artIds: readonly number[]): readonly number[] {
  artIdsByPasscode.set(passcode, artIds);
  return artIds;
}

async function fetchArtIdsForPasscode(passcode: number): Promise<readonly number[] | undefined> {
  const cached = artIdsByPasscode.get(passcode);
  if (cached) return cached;

  const inflight = inflightByPasscode.get(passcode);
  if (inflight) return inflight;

  const request = (async () => {
    try {
      const response = await fetch(`${YGO_CARDINFO_URL}?id=${passcode}`);
      if (!response.ok) return undefined;
      const json = (await response.json()) as { data?: YgoApiCard[] };
      const row = json.data?.[0];
      if (!row) return undefined;
      const artIds = mapYgoproArtIds(row);
      return cacheArtIds(passcode, artIds);
    } catch {
      return undefined;
    } finally {
      inflightByPasscode.delete(passcode);
    }
  })();

  inflightByPasscode.set(passcode, request);
  return request;
}

const BATCH_SIZE = 40;

/** Fetches alternate artwork passcodes from YGOPRODeck for cards missing them in the catalog. */
export async function fetchYgoproArtIdsForPasscodes(
  passcodes: readonly number[],
): Promise<Map<number, readonly number[]>> {
  const unique = [...new Set(passcodes)];
  const results = new Map<number, readonly number[]>();

  for (let offset = 0; offset < unique.length; offset += BATCH_SIZE) {
    const batch = unique.slice(offset, offset + BATCH_SIZE);
    const missing = batch.filter((id) => !artIdsByPasscode.has(id));
    if (missing.length === 0) {
      for (const id of batch) {
        const cached = artIdsByPasscode.get(id);
        if (cached) results.set(id, cached);
      }
      continue;
    }

    try {
      const response = await fetch(`${YGO_CARDINFO_URL}?id=${missing.join(',')}`);
      if (!response.ok) continue;
      const json = (await response.json()) as { data?: YgoApiCard[] };
      for (const row of json.data ?? []) {
        const artIds = cacheArtIds(row.id, mapYgoproArtIds(row));
        results.set(row.id, artIds);
      }
    } catch {
      /* ignore batch failure */
    }

    for (const id of batch) {
      const cached = artIdsByPasscode.get(id);
      if (cached) results.set(id, cached);
    }
  }

  return results;
}

export function queueYgoproArtIdLookup(passcode: number): void {
  if (artIdsByPasscode.has(passcode) || inflightByPasscode.has(passcode)) return;
  void fetchArtIdsForPasscode(passcode);
}

/** Test-only */
export function clearYgoproArtIdCache(): void {
  artIdsByPasscode.clear();
  inflightByPasscode.clear();
}
