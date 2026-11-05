import type { YgoApiCard } from '../../pipeline/ygoprodeckTypes.ts';

const YGO_CARDINFO_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

const artIdsByPasscode = new Map<number, readonly number[]>();
const inflightByPasscode = new Map<number, Promise<readonly number[] | undefined>>();
const inflightRowsByName = new Map<string, Promise<readonly YgoApiCard[] | undefined>>();

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

/** Pick the full artwork list for a passcode from a name= API payload. */
export function resolveArtIdsFromNameRows(
  rows: readonly YgoApiCard[],
  passcode: number,
): readonly number[] {
  const direct = rows.find((row) => row.id === passcode);
  if (direct) {
    const artIds = mapYgoproArtIds(direct);
    if (artIds.length > 1) return artIds;
  }
  for (const row of rows) {
    const artIds = mapYgoproArtIds(row);
    if (artIds.includes(passcode)) return artIds;
  }
  return [passcode];
}

function cacheArtIds(passcode: number, artIds: readonly number[]): readonly number[] {
  artIdsByPasscode.set(passcode, artIds);
  return artIds;
}

function hasRichArtIdsCache(passcode: number): boolean {
  const cached = artIdsByPasscode.get(passcode);
  return cached != null && cached.length > 1;
}

async function fetchRowsByExactName(name: string): Promise<readonly YgoApiCard[] | undefined> {
  const inflight = inflightRowsByName.get(name);
  if (inflight) return inflight;

  const request = (async () => {
    try {
      const response = await fetch(`${YGO_CARDINFO_URL}?name=${encodeURIComponent(name)}`);
      if (!response.ok) return undefined;
      const json = (await response.json()) as { data?: YgoApiCard[] };
      return json.data ?? [];
    } catch {
      return undefined;
    } finally {
      inflightRowsByName.delete(name);
    }
  })();

  inflightRowsByName.set(name, request);
  return request;
}

async function resolveArtIdsForPasscode(passcode: number): Promise<readonly number[] | undefined> {
  if (hasRichArtIdsCache(passcode)) {
    return artIdsByPasscode.get(passcode);
  }

  try {
    const response = await fetch(`${YGO_CARDINFO_URL}?id=${passcode}`);
    if (!response.ok) return undefined;
    const json = (await response.json()) as { data?: YgoApiCard[] };
    const seed = json.data?.[0];
    if (!seed) return undefined;

    const fromId = mapYgoproArtIds(seed);
    if (fromId.length > 1) {
      return cacheArtIds(passcode, fromId);
    }

    const name = seed.name?.trim();
    if (!name) {
      return cacheArtIds(passcode, fromId);
    }

    const nameRows = await fetchRowsByExactName(name);
    if (!nameRows || nameRows.length === 0) {
      return cacheArtIds(passcode, fromId);
    }

    return cacheArtIds(passcode, resolveArtIdsFromNameRows(nameRows, passcode));
  } catch {
    return undefined;
  }
}

async function fetchArtIdsForPasscode(passcode: number): Promise<readonly number[] | undefined> {
  const cached = artIdsByPasscode.get(passcode);
  if (cached) return cached;

  const inflight = inflightByPasscode.get(passcode);
  if (inflight) return inflight;

  const request = resolveArtIdsForPasscode(passcode).finally(() => {
    inflightByPasscode.delete(passcode);
  });

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
    const missing = batch.filter((id) => !hasRichArtIdsCache(id));

    for (const id of batch) {
      const cached = artIdsByPasscode.get(id);
      if (cached) results.set(id, cached);
    }

    if (missing.length === 0) continue;

    await Promise.all(
      missing.map(async (passcode) => {
        const artIds = await fetchArtIdsForPasscode(passcode);
        if (artIds) results.set(passcode, artIds);
      }),
    );
  }

  return results;
}

export async function fetchYgoproCardRow(passcode: number): Promise<YgoApiCard | undefined> {
  try {
    const response = await fetch(`${YGO_CARDINFO_URL}?id=${passcode}`);
    if (!response.ok) return undefined;
    const json = (await response.json()) as { data?: YgoApiCard[] };
    const row = json.data?.[0];
    if (!row) return undefined;
    await fetchArtIdsForPasscode(passcode);
    return row;
  } catch {
    return undefined;
  }
}

export function queueYgoproArtIdLookup(passcode: number): void {
  if (hasRichArtIdsCache(passcode) || inflightByPasscode.has(passcode)) return;
  void fetchArtIdsForPasscode(passcode);
}

/** Test-only */
export function clearYgoproArtIdCache(): void {
  artIdsByPasscode.clear();
  inflightByPasscode.clear();
  inflightRowsByName.clear();
}
