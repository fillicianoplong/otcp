const TOKEN = /[a-z0-9']+/g;

/** Word tokens of length 3 or more. Shared by indexing and query. */
export function tokenize(value: string): string[] {
  TOKEN.lastIndex = 0;
  const lower = value.toLowerCase();
  const out: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = TOKEN.exec(lower))) {
    if (match[0].length >= 3) out.push(match[0]);
  }
  return out;
}

/** Character trigrams of an already-lowercased string. */
export function trigramsOf(value: string): string[] {
  const out: string[] = [];
  for (let i = 0; i <= value.length - 3; i++) out.push(value.slice(i, i + 3));
  return out;
}
