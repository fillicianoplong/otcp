/** In-app Account route (BrowserRouter basename applies separately). */
export const accountUrl = '/account';

/** Query param carrying a safe in-app path to return to after sign-in. */
export const AUTH_RETURN_TO_QUERY = 'returnTo';

/** HTTPS URL for the account page (email confirmation redirect target). */
export function buildAccountRedirectUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  const base = import.meta.env.BASE_URL || '/';
  const accountPath = base.endsWith('/') ? `${base}account` : `${base}/account`;
  return `${window.location.origin}${accountPath}`;
}

/** Path back to the Decks list with a draft selected for follow-up save (#42). */
export function buildDecksDraftReturnPath(draftId: string): string {
  return `/decks?draft=${encodeURIComponent(draftId)}`;
}

/** Accept only same-app relative paths under Decks for now. */
export function parseSafeInAppReturnTo(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') {
    return null;
  }
  if (!raw.startsWith('/') || raw.startsWith('//')) {
    return null;
  }
  if (raw.includes('://')) {
    return null;
  }
  if (!raw.startsWith('/decks')) {
    return null;
  }
  return raw;
}

export function buildAccountPathWithReturn(returnTo: string): string {
  const safe = parseSafeInAppReturnTo(returnTo);
  if (!safe) {
    return accountUrl;
  }
  const params = new URLSearchParams({ [AUTH_RETURN_TO_QUERY]: safe });
  return `${accountUrl}?${params.toString()}`;
}
