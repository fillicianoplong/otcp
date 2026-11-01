/// <reference types="vite/client" />

/** Turn a site-root or repo `public/…` path into a URL under the Vite base. */
export function publicDataUrl(repoRelativePath: string): string {
  const withoutPublic = repoRelativePath.replace(/^public\//, '');
  const base = import.meta.env.BASE_URL;
  return `${base}${withoutPublic}`;
}

export const CURRENT_POINTER_URL = publicDataUrl('data/current.json');
