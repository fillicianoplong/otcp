import type { YugiohCard } from '../shared/schema/card.ts';

function formatStat(value: number | undefined): string {
  if (value === undefined || value < 0) return '?';
  return String(value);
}

function monsterSubtypeTokens(type: string): string[] {
  return type.split(/\s+/).filter((part) => part.length > 0 && part !== 'Monster');
}

function spellTypeLine(card: YugiohCard): string {
  if (card.type.startsWith('Quick-Play')) return 'Quick-Play Spell';
  const property = card.race?.trim();
  if (property) return `${property} Spell`;
  return 'Spell';
}

function trapTypeLine(card: YugiohCard): string {
  const property = card.race?.trim();
  if (property) return `${property} Trap`;
  return 'Trap';
}

/** Readable type column: attribute + subtypes + race, or Spell/Trap property line. */
export function buildListRowTypeLine(card: YugiohCard): string {
  if (card.type.includes('Spell')) return spellTypeLine(card);
  if (card.type.includes('Trap')) return trapTypeLine(card);

  const parts: string[] = [];
  if (card.attribute) parts.push(card.attribute);
  for (const token of monsterSubtypeTokens(card.type)) {
    parts.push(token);
  }
  if (card.race) parts.push(card.race);
  return parts.join(' · ');
}

/** Level / Rank / Link label, or null for spells and traps. */
export function buildListRowLevelLine(card: YugiohCard): string | null {
  if (card.type.includes('Spell') || card.type.includes('Trap')) return null;
  if (card.linkRating != null) return `Link ${card.linkRating}`;
  if (card.rank != null) return `Rank ${card.rank}`;
  if (card.level != null) return `Level ${card.level}`;
  return null;
}

/** ATK/DEF or Link stat line for monsters; null when not applicable. */
export function buildListRowStatsLine(card: YugiohCard): string | null {
  if (card.type.includes('Spell') || card.type.includes('Trap')) return null;
  const atk = formatStat(card.atk);
  if (card.linkRating != null) {
    return `ATK ${atk} · Link ${card.linkRating}`;
  }
  const def = formatStat(card.def);
  return `ATK ${atk} / DEF ${def}`;
}

/** @deprecated Segments retained for tests migrating to readable lines. */
export type ListRowStatBadges = {
  atk: string;
  def?: string;
  linkRating?: number;
};

export function buildListRowStatBadges(card: YugiohCard): ListRowStatBadges {
  const atk = formatStat(card.atk);
  if (card.linkRating != null) {
    return { atk, linkRating: card.linkRating };
  }
  return { atk, def: formatStat(card.def) };
}
