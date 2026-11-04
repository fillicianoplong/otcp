import { normalizeFormatId, type FormatId } from './formatCatalog.ts';

export type DeckSectionLimits = {
  readonly mainMin: number;
  readonly mainMax: number;
  readonly extraMax: number;
  readonly sideMax: number;
  readonly maxActiveSkills: number;
};

const ADVANCED_LIMITS: DeckSectionLimits = {
  mainMin: 40,
  mainMax: 60,
  extraMax: 15,
  sideMax: 15,
  maxActiveSkills: 0,
};

const SPEED_DUEL_LIMITS: DeckSectionLimits = {
  mainMin: 20,
  mainMax: 30,
  extraMax: 6,
  sideMax: 6,
  maxActiveSkills: 1,
};

export function deckSectionLimitsForFormat(
  formatParam: string | null | undefined,
): DeckSectionLimits {
  const formatId = normalizeFormatId(formatParam);
  if (formatId === 'speed-duel') {
    return SPEED_DUEL_LIMITS;
  }
  return ADVANCED_LIMITS;
}

export function formatUsesSkillSlot(formatId: FormatId | null): boolean {
  return formatId === 'speed-duel';
}
