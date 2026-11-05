import { FORMAT_QUERY_KEY } from './formatBanContext.ts';
import { normalizeFormatId } from '../format/formatCatalog.ts';

export function buildSearchCardDetailPath(
  cardId: number,
  options?: { searchQuery?: string; formatParam?: string | null; artId?: number },
): string {
  const pathId = options?.artId != null && Number.isFinite(options.artId) ? options.artId : cardId;
  const params = new URLSearchParams();
  const query = options?.searchQuery?.trim();
  if (query && query.length > 0) {
    params.set('q', query);
  }
  const formatId = normalizeFormatId(options?.formatParam);
  if (formatId) {
    params.set(FORMAT_QUERY_KEY, formatId);
  }
  const search = params.toString();
  return `/search/card/${pathId}${search ? `?${search}` : ''}`;
}

export function buildSearchPathWithFormat(
  formatParam: string | null,
  existingSearch?: string,
): string {
  const params = new URLSearchParams(existingSearch ?? '');
  const formatId = normalizeFormatId(formatParam);
  if (formatId) {
    params.set(FORMAT_QUERY_KEY, formatId);
  } else {
    params.delete(FORMAT_QUERY_KEY);
  }
  const search = params.toString();
  return `/search${search ? `?${search}` : ''}`;
}
