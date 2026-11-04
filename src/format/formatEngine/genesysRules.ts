import type { YugiohCard } from '../../shared/schema/card.ts';
import { getGenesysKonamiPointsDocument } from '../genesysKonamiPoints.ts';
import { getFormatById, normalizeFormatId } from '../formatCatalog.ts';

export const DEFAULT_GENESYS_POINT_CAP = getGenesysKonamiPointsDocument().standardPointCap;

export function isGenesysFormat(formatParam: string | null | undefined): boolean {
  return normalizeFormatId(formatParam) === 'genesys';
}

/** Genesys forbids Link and Pendulum monsters (FR-18). */
export function isGenesysLegalCardType(type: string): boolean {
  const normalized = type.toLowerCase();
  return !normalized.includes('link') && !normalized.includes('pendulum');
}

export function genesysRefusalReasonForCard(
  card: Pick<YugiohCard, 'type'>,
): 'link-monster' | 'pendulum-monster' | null {
  const normalized = card.type.toLowerCase();
  if (normalized.includes('link')) {
    return 'link-monster';
  }
  if (normalized.includes('pendulum')) {
    return 'pendulum-monster';
  }
  return null;
}

export function resolveGenesysPoints(card: Pick<YugiohCard, 'genesysPoints'>): number {
  const points = card.genesysPoints;
  if (typeof points !== 'number' || !Number.isFinite(points) || points < 0) {
    return 0;
  }
  return Math.trunc(points);
}

export function resolveGenesysPointCap(storedCap: number | null | undefined): number {
  if (storedCap == null) {
    return DEFAULT_GENESYS_POINT_CAP;
  }
  const cap = Math.trunc(storedCap);
  if (!Number.isFinite(cap) || cap < 0) {
    return DEFAULT_GENESYS_POINT_CAP;
  }
  return cap;
}

export function sumGenesysDeckPoints(
  sections: readonly { readonly cardIds: readonly number[] }[],
  lookupCard: (id: number) => Pick<YugiohCard, 'genesysPoints'> | undefined,
): number {
  let total = 0;
  for (const section of sections) {
    for (const id of section.cardIds) {
      const card = lookupCard(id);
      if (!card) continue;
      total += resolveGenesysPoints(card);
    }
  }
  return total;
}

export type GenesysDeckPointStatus = {
  readonly totalPoints: number;
  readonly cap: number;
  readonly overCap: boolean;
};

export function evaluateGenesysDeckPoints(
  main: readonly number[],
  extra: readonly number[],
  side: readonly number[],
  lookupCard: (id: number) => Pick<YugiohCard, 'genesysPoints'> | undefined,
  storedCap: number | null | undefined,
): GenesysDeckPointStatus {
  const cap = resolveGenesysPointCap(storedCap);
  const totalPoints = sumGenesysDeckPoints(
    [{ cardIds: main }, { cardIds: extra }, { cardIds: side }],
    lookupCard,
  );
  return {
    totalPoints,
    cap,
    overCap: totalPoints > cap,
  };
}

export function canAddCardToGenesysDeck(card: Pick<YugiohCard, 'type'>): boolean {
  return isGenesysLegalCardType(card.type);
}

/** Whether the active format uses Genesys point rules. */
export function formatUsesGenesysPoints(formatParam: string | null | undefined): boolean {
  const formatId = normalizeFormatId(formatParam);
  if (!formatId) return false;
  return getFormatById(formatId)?.banlistSource === 'genesys-points';
}
