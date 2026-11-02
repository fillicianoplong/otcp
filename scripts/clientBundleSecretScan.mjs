/**
 * Scan built client JS for leaked Supabase secrets (not library string literals).
 */

const SB_SECRET_KEY_PATTERN = /sb_secret_[A-Za-z0-9_-]{20,}/g;
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

function decodeBase64Url(segment) {
  const padded = segment + '='.repeat((4 - (segment.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

/**
 * @param {string} text
 * @returns {{ kind: string; detail: string }[]}
 */
export function findSecretHitsInText(text) {
  const hits = [];

  for (const match of text.matchAll(SB_SECRET_KEY_PATTERN)) {
    hits.push({ kind: 'sb_secret_', detail: match[0] });
  }

  for (const match of text.matchAll(JWT_PATTERN)) {
    const token = match[0];
    const parts = token.split('.');
    if (parts.length < 2) {
      continue;
    }
    try {
      const payloadJson = decodeBase64Url(parts[1]);
      const payload = JSON.parse(payloadJson);
      if (payload && payload.role === 'service_role') {
        hits.push({ kind: 'service_role_jwt', detail: token.slice(0, 24) + '…' });
      }
    } catch {
      // Ignore malformed JWT-shaped strings.
    }
  }

  return hits;
}

/**
 * @param {string} distAssetsDir
 * @returns {{ file: string; kind: string; detail: string }[]}
 */
export function findSecretHitsInBundle(distAssetsDir, readDir, readFile) {
  let names;
  try {
    names = readDir(distAssetsDir).filter((name) => name.endsWith('.js'));
  } catch {
    return null;
  }

  const hits = [];
  for (const file of names) {
    const text = readFile(`${distAssetsDir}/${file}`, 'utf8');
    for (const hit of findSecretHitsInText(text)) {
      hits.push({ file, ...hit });
    }
  }
  return hits;
}
