import { OTCP_PIPELINE_USER_AGENT, YGOPRODECK_CARDINFO_URL } from './constants.ts';
import type { YgoCardinfoResponse } from './ygoprodeckTypes.ts';

export type FetchCardDumpOptions = {
  url?: string;
  userAgent?: string;
  fetchImpl?: typeof fetch;
  maxAttempts?: number;
  initialBackoffMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function retryAfterMs(response: Response): number | undefined {
  const header = response.headers.get('retry-after');
  if (!header) return undefined;
  const seconds = Number.parseInt(header, 10);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return undefined;
}

export async function fetchCardDump(
  options: FetchCardDumpOptions = {},
): Promise<YgoCardinfoResponse> {
  const url = options.url ?? YGOPRODECK_CARDINFO_URL;
  const userAgent = options.userAgent ?? OTCP_PIPELINE_USER_AGENT;
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxAttempts = options.maxAttempts ?? 4;
  const initialBackoffMs = options.initialBackoffMs ?? 1000;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': userAgent,
        },
      });

      if (response.ok) {
        const body = (await response.json()) as YgoCardinfoResponse;
        if (!body || !Array.isArray(body.data)) {
          throw new Error('YGOPRODeck response missing data array');
        }
        return body;
      }

      if (response.status === 429 || response.status >= 500) {
        const wait = retryAfterMs(response) ?? initialBackoffMs * 2 ** (attempt - 1);
        if (attempt < maxAttempts) {
          await sleep(wait);
          continue;
        }
      }

      throw new Error(`YGOPRODeck fetch failed: HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(initialBackoffMs * 2 ** (attempt - 1));
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
