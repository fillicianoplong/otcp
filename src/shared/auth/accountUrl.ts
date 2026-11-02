/** HTTPS URL for the account page (email confirmation redirect target). */
export function buildAccountRedirectUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  const base = import.meta.env.BASE_URL || '/';
  const accountPath = base.endsWith('/') ? `${base}account` : `${base}/account`;
  return `${window.location.origin}${accountPath}`;
}
