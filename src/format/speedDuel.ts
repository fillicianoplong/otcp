import type { YugiohCard } from '../shared/schema/card.ts';

export function isSkillCard(card: YugiohCard): boolean {
  return card.type === 'Skill Card';
}

/** YGOPRODeck Speed Duel pool (`misc_info.formats` includes Speed Duel). */
export function isSpeedDuelPoolCard(card: YugiohCard): boolean {
  return card.speedDuelLegal === true;
}
