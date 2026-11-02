import { describe, expect, it } from 'vitest';

import { buildCardDetailDescriptionBlocks } from '../../src/catalog/cardDetailDescriptions.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import monsterNormal from '../fixtures/schema/monster-normal.json';
import pendulumMonster from '../fixtures/schema/pendulum-monster.json';

describe('buildCardDetailDescriptionBlocks', () => {
  it('uses card text as Description for normal monsters', () => {
    const blocks = buildCardDetailDescriptionBlocks(monsterNormal as YugiohCard);
    expect(blocks.pendulumEffect).toBeUndefined();
    expect(blocks.description).toBe(monsterNormal.text);
  });

  it('splits pendulum and monster text when both fields are present', () => {
    const blocks = buildCardDetailDescriptionBlocks(pendulumMonster as YugiohCard);
    expect(blocks.pendulumEffect).toBe(pendulumMonster.pendDesc);
    expect(blocks.description).toBe(pendulumMonster.monsterDesc);
  });
});
