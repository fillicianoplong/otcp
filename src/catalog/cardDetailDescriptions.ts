import type { YugiohCard } from '../shared/schema/card.ts';

export type CardDetailDescriptionBlocks = {
  pendulumEffect?: string;
  description?: string;
};

export function buildCardDetailDescriptionBlocks(card: YugiohCard): CardDetailDescriptionBlocks {
  const pendulumEffect = card.pendDesc?.trim();
  const monsterDesc = card.monsterDesc?.trim();
  const fallbackText = card.text?.trim();

  const description = monsterDesc && monsterDesc.length > 0 ? monsterDesc : fallbackText;

  const blocks: CardDetailDescriptionBlocks = {};
  if (pendulumEffect && pendulumEffect.length > 0) {
    blocks.pendulumEffect = pendulumEffect;
  }
  if (description && description.length > 0) {
    blocks.description = description;
  }
  return blocks;
}
