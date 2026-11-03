import { FORMAT_QUERY_KEY } from '../catalog/formatBanContext.ts';
import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';
import { isKnownFormatId, normalizeFormatId, type FormatId } from './formatCatalog.ts';

export const FORMAT_STORAGE_KEY = 'otcp:format';

export type ResolvedFormatPreference = {
  formatId: FormatId | null;
  /** Stored value was present but not a known format id. */
  invalidStored: boolean;
};

export function readFormatPreference(): string | null {
  return readLocalStorageString(FORMAT_STORAGE_KEY);
}

export function writeFormatPreference(formatId: FormatId | null): void {
  if (formatId === null) {
    try {
      localStorage.removeItem(FORMAT_STORAGE_KEY);
    } catch {
      // ignore
    }
    return;
  }
  writeLocalStorageString(FORMAT_STORAGE_KEY, formatId);
}

/** URL param wins, then stored value; unknown stored values are ignored. */
export function resolveFormatPreference(options: {
  urlParam: string | null;
  storedRaw: string | null;
}): ResolvedFormatPreference {
  const { urlParam, storedRaw } = options;
  if (urlParam !== null && urlParam.length > 0) {
    const fromUrl = normalizeFormatId(urlParam);
    return { formatId: fromUrl, invalidStored: false };
  }
  if (storedRaw !== null && storedRaw.length > 0) {
    if (isKnownFormatId(storedRaw)) {
      return { formatId: normalizeFormatId(storedRaw), invalidStored: false };
    }
    return { formatId: null, invalidStored: true };
  }
  return { formatId: null, invalidStored: false };
}

export function formatQueryValue(formatId: FormatId | null): string | null {
  return formatId;
}

export function applyFormatToSearchParams(
  params: URLSearchParams,
  formatId: FormatId | null,
): void {
  if (formatId) {
    params.set(FORMAT_QUERY_KEY, formatId);
  } else {
    params.delete(FORMAT_QUERY_KEY);
  }
}
