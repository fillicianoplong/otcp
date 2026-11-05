import { getFormatById } from './format/formatCatalog.ts';
import { PRIMARY_NAV } from './nav.ts';

export const PRODUCT_DOCUMENT_TITLE = 'OTCP';

const TOP_LEVEL_LABEL_BY_PATH = new Map(PRIMARY_NAV.map((item) => [item.to, item.label]));

/** `Page - OTCP`, or `OTCP` when the page label is missing. */
export function formatDocumentTitle(pageLabel: string | null | undefined): string {
  const label = pageLabel?.trim() ?? '';
  if (label.length === 0) return PRODUCT_DOCUMENT_TITLE;
  return `${label} - ${PRODUCT_DOCUMENT_TITLE}`;
}

function pathSegments(pathname: string): string[] {
  const withoutTrailingSlash = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return withoutTrailingSlash.split('/').filter((segment) => segment.length > 0);
}

/** Card passcode on `/search/card/:id`, otherwise null. */
export function cardRouteIdFromPathname(pathname: string): number | null {
  const segments = pathSegments(pathname);
  if (segments.length !== 3 || segments[0] !== 'search' || segments[1] !== 'card') return null;
  const id = Number.parseInt(segments[2] ?? '', 10);
  if (!Number.isFinite(id)) return null;
  return id;
}

/** Guest draft id on `/decks/edit/:draftId`, otherwise null. */
export function deckDraftIdFromPathname(pathname: string): string | null {
  const segments = pathSegments(pathname);
  if (segments.length !== 3 || segments[0] !== 'decks' || segments[1] !== 'edit') return null;
  const id = segments[2];
  return id && id.length > 0 ? id : null;
}

/**
 * Document title for a router pathname (no basename, no query).
 * Card and deck names are supplied by the caller once they are known.
 * Format names come from the format catalog. Unknown routes use the product title.
 */
export function documentTitleForRoute(input: {
  pathname: string;
  cardName?: string | null;
  deckName?: string | null;
}): string {
  const segments = pathSegments(input.pathname);
  if (segments.length === 0) return PRODUCT_DOCUMENT_TITLE;

  const [root, ...rest] = segments;

  if (root === 'search' && rest.length === 2 && rest[0] === 'card') {
    return formatDocumentTitle(input.cardName);
  }

  if (root === 'formats' && rest.length === 1) {
    return formatDocumentTitle(getFormatById(rest[0])?.name);
  }

  if (root === 'decks' && rest.length === 2 && rest[0] === 'edit') {
    return formatDocumentTitle(input.deckName);
  }

  if (rest.length === 0) {
    const label = TOP_LEVEL_LABEL_BY_PATH.get(`/${root}`);
    if (label) return formatDocumentTitle(label);
  }

  return PRODUCT_DOCUMENT_TITLE;
}
