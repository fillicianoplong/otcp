import { z } from 'zod';

import { OTCP_DATASET_SCHEMA_VERSION } from './constants.ts';
import type { CatalogSearchCard } from './catalogSearch.ts';
import type { SetIndex } from './setIndex.ts';

const lexiconSchema = z
  .object({
    t: z.array(z.string()),
    r: z.array(z.string()),
    a: z.array(z.string()),
    ar: z.array(z.string()),
    sn: z.array(z.string()),
    ra: z.array(z.string()),
    bt: z.array(z.string()),
    lk: z.array(z.string()),
  })
  .strict();

export type SearchIndexLexicon = z.infer<typeof lexiconSchema>;

const setIndexEntrySchema = z
  .object({
    tcgDate: z.string().optional(),
    numOfCards: z.number().optional(),
  })
  .strict();

export const compactSearchIndexEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(OTCP_DATASET_SCHEMA_VERSION),
    generatedAt: z.iso.datetime(),
    source: z.string().min(1),
    lex: lexiconSchema,
    i: z.array(z.number().int().positive()),
    n: z.array(z.string().min(1)),
    t: z.array(z.number().int().nonnegative()),
    bk: z.array(z.number().int().nonnegative()),
    r: z.array(z.number().int()),
    a: z.array(z.number().int()),
    l: z.array(z.number().int()).optional(),
    rk: z.array(z.number().int()).optional(),
    lkr: z.array(z.number().int()).optional(),
    lm: z.array(z.array(z.number().int().nonnegative())).optional(),
    at: z.array(z.number().int()).optional(),
    d: z.array(z.number().int()).optional(),
    ar: z.array(z.number().int()).optional(),
    pc: z.array(z.number().int().positive()).optional(),
    bt: z.array(z.number().int()).optional(),
    pt: z.array(z.number()).optional(),
    pr: z.array(z.array(z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]))),
    si: z.record(z.string(), setIndexEntrySchema).optional(),
  })
  .strict();

export type CompactSearchIndexEnvelope = z.infer<typeof compactSearchIndexEnvelopeSchema>;

class StringInterner {
  readonly values: string[] = [];
  private readonly indexByValue = new Map<string, number>();

  intern(value: string | undefined): number {
    if (!value) return -1;
    const existing = this.indexByValue.get(value);
    if (existing !== undefined) return existing;
    const next = this.values.length;
    this.values.push(value);
    this.indexByValue.set(value, next);
    return next;
  }

  lookup(index: number): string | undefined {
    if (index < 0) return undefined;
    return this.values[index];
  }
}

function buildLexicon(): {
  t: StringInterner;
  r: StringInterner;
  a: StringInterner;
  ar: StringInterner;
  sn: StringInterner;
  ra: StringInterner;
  bt: StringInterner;
  lk: StringInterner;
} {
  return {
    t: new StringInterner(),
    r: new StringInterner(),
    a: new StringInterner(),
    ar: new StringInterner(),
    sn: new StringInterner(),
    ra: new StringInterner(),
    bt: new StringInterner(),
    lk: new StringInterner(),
  };
}

function lexiconToWire(lex: ReturnType<typeof buildLexicon>): SearchIndexLexicon {
  return {
    t: lex.t.values,
    r: lex.r.values,
    a: lex.a.values,
    ar: lex.ar.values,
    sn: lex.sn.values,
    ra: lex.ra.values,
    bt: lex.bt.values,
    lk: lex.lk.values,
  };
}

function compactSetIndex(setIndex: SetIndex | undefined, sn: StringInterner): SetIndex | undefined {
  if (!setIndex || Object.keys(setIndex).length === 0) return undefined;
  const out: SetIndex = {};
  for (const [setName, entry] of Object.entries(setIndex)) {
    const idx = sn.intern(setName);
    if (idx >= 0) out[String(idx)] = entry;
  }
  return out;
}

function expandSetIndex(
  compact: SetIndex | undefined,
  snLex: readonly string[],
): SetIndex | undefined {
  if (!compact) return undefined;
  const out: SetIndex = {};
  for (const [idxText, entry] of Object.entries(compact)) {
    const name = snLex[Number.parseInt(idxText, 10)];
    if (name) out[name] = entry;
  }
  return out;
}

export function encodeCompactSearchIndex(
  cards: readonly CatalogSearchCard[],
  generatedAt: string,
  source: string,
  setIndex?: SetIndex,
): CompactSearchIndexEnvelope {
  const lex = buildLexicon();
  const i: number[] = [];
  const n: string[] = [];
  const t: number[] = [];
  const bk: number[] = [];
  const r: number[] = [];
  const a: number[] = [];
  const l: number[] = [];
  const rk: number[] = [];
  const lkr: number[] = [];
  const lm: number[][] = [];
  const at: number[] = [];
  const d: number[] = [];
  const ar: number[] = [];
  const pc: number[] = [];
  const bt: number[] = [];
  const pt: number[] = [];
  const pr: CompactSearchIndexEnvelope['pr'] = [];

  let anyLevel = false;
  let anyRank = false;
  let anyLink = false;
  let anyLinkMarkers = false;
  let anyAtk = false;
  let anyDef = false;
  let anyArchetype = false;
  let anyPasscode = false;
  let anyBan = false;
  let anyPrice = false;

  for (const card of cards) {
    i.push(card.id);
    n.push(card.name);
    t.push(lex.t.intern(card.type));
    bk.push(card.detailBucket);
    r.push(lex.r.intern(card.race));
    a.push(lex.a.intern(card.attribute));

    if (card.level != null) anyLevel = true;
    if (card.rank != null) anyRank = true;
    if (card.linkRating != null) anyLink = true;
    if (card.linkMarkers && card.linkMarkers.length > 0) anyLinkMarkers = true;
    if (card.atk != null) anyAtk = true;
    if (card.def != null) anyDef = true;
    if (card.archetype) anyArchetype = true;
    if (card.passcode != null && card.passcode !== card.id) anyPasscode = true;
    if (card.banlistInfo?.banTcg) anyBan = true;
    if (card.prices?.tcgplayer != null) anyPrice = true;

    l.push(card.level ?? -1);
    rk.push(card.rank ?? -1);
    lkr.push(card.linkRating ?? -1);
    lm.push((card.linkMarkers ?? []).map((marker) => lex.lk.intern(marker)).filter((v) => v >= 0));
    at.push(card.atk ?? -9999);
    d.push(card.def ?? -9999);
    ar.push(lex.ar.intern(card.archetype));
    pc.push(card.passcode ?? card.id);
    bt.push(lex.bt.intern(card.banlistInfo?.banTcg));
    pt.push(card.prices?.tcgplayer ?? -1);
    pr.push(
      card.setNames.map((setName, index) => [
        lex.sn.intern(setName),
        lex.ra.intern(card.rarities[index] ?? card.rarities[0] ?? 'Unknown'),
      ]),
    );
  }

  return {
    schemaVersion: OTCP_DATASET_SCHEMA_VERSION,
    generatedAt,
    source,
    lex: lexiconToWire(lex),
    i,
    n,
    t,
    bk,
    r,
    a,
    ...(anyLevel ? { l } : {}),
    ...(anyRank ? { rk } : {}),
    ...(anyLink ? { lkr } : {}),
    ...(anyLinkMarkers ? { lm } : {}),
    ...(anyAtk ? { at } : {}),
    ...(anyDef ? { d } : {}),
    ...(anyArchetype ? { ar } : {}),
    ...(anyPasscode ? { pc } : {}),
    ...(anyBan ? { bt } : {}),
    ...(anyPrice ? { pt } : {}),
    pr,
    ...(setIndex ? { si: compactSetIndex(setIndex, lex.sn) } : {}),
  };
}

export function decodeCompactSearchIndex(envelope: CompactSearchIndexEnvelope): {
  cards: CatalogSearchCard[];
  generatedAt: string;
  source: string;
  setIndex?: SetIndex;
} {
  const { lex } = envelope;
  const count = envelope.i.length;
  const cards: CatalogSearchCard[] = [];

  for (let row = 0; row < count; row += 1) {
    const id = envelope.i[row]!;
    const setNames: string[] = [];
    const rarities: string[] = [];
    for (const [snIdx, raIdx] of envelope.pr[row] ?? []) {
      const setName = lex.sn[snIdx];
      const rarity = lex.ra[raIdx];
      if (setName && rarity) {
        setNames.push(setName);
        rarities.push(rarity);
      }
    }

    const type = lex.t[envelope.t[row]!] ?? 'Unknown';
    const race = lex.r[envelope.r[row]!];
    const attribute = lex.a[envelope.a[row]!] as CatalogSearchCard['attribute'];
    const level = envelope.l?.[row];
    const rank = envelope.rk?.[row];
    const linkRating = envelope.lkr?.[row];
    const atk = envelope.at?.[row];
    const def = envelope.d?.[row];
    const archetype = envelope.ar ? lex.ar[envelope.ar[row]!] : undefined;
    const passcodeRaw = envelope.pc?.[row];
    const banTcg = envelope.bt ? lex.bt[envelope.bt[row]!] : undefined;
    const tcgPrice = envelope.pt?.[row];
    const linkMarkerIdxs = envelope.lm?.[row] ?? [];
    const linkMarkers = linkMarkerIdxs
      .map((idx) => lex.lk[idx])
      .filter((value): value is string => Boolean(value));

    const card: CatalogSearchCard = {
      id,
      name: envelope.n[row]!,
      type,
      setNames,
      rarities,
      detailBucket: envelope.bk[row]!,
      ...(race ? { race } : {}),
      ...(attribute ? { attribute } : {}),
      ...(level != null && level >= 0 ? { level } : {}),
      ...(rank != null && rank >= 0 ? { rank } : {}),
      ...(linkRating != null && linkRating >= 0 ? { linkRating } : {}),
      ...(linkMarkers.length > 0 ? { linkMarkers } : {}),
      ...(atk != null && atk > -9999 ? { atk } : {}),
      ...(def != null && def > -9999 ? { def } : {}),
      ...(archetype ? { archetype } : {}),
      ...(passcodeRaw != null && passcodeRaw !== id ? { passcode: passcodeRaw } : {}),
      ...(banTcg ? { banlistInfo: { banTcg: banTcg as 'Forbidden' } } : {}),
      ...(tcgPrice != null && tcgPrice >= 0 ? { prices: { tcgplayer: tcgPrice } } : {}),
    };
    cards.push(card);
  }

  return {
    cards,
    generatedAt: envelope.generatedAt,
    source: envelope.source,
    setIndex: expandSetIndex(envelope.si, lex.sn),
  };
}

export function isCompactSearchIndexEnvelope(value: unknown): value is CompactSearchIndexEnvelope {
  return compactSearchIndexEnvelopeSchema.safeParse(value).success;
}
