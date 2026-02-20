/// <reference types="vite/client" />

/** Turn a repo `public/…` path into a URL under the Vite base. */
export function publicDataUrl(repoRelativePath: string): string {
  const withoutPublic = repoRelativePath.replace(/^public\//, '');
  const base = import.meta.env.BASE_URL;
  return `${base}${withoutPublic}`;
}

export const CURRENT_POINTER_URL = publicDataUrl('public/data/current.json');
