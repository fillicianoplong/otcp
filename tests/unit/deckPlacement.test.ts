import { describe, expect, it } from 'vitest';

import {
  addCardToDeck,
  deckCopyCount,
  groupZoneCardIds,
  isExtraDeckMonster,
  moveCardBetweenZones,
  removeOneCardFromZone,
  removeOneLibraryCopy,
  type DeckCardLists,
} from '../../src/deckEditor/deckPlacement.ts';
import { OTCP_CARD_SCHEMA_VERSION } from '../../src/shared/schema/constants.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

function card(
  overrides: Pick<YugiohCard, 'id' | 'name' | 'type'> & Partial<YugiohCard>,
): YugiohCard {
  return {
    schemaVersion: OTCP_CARD_SCHEMA_VERSION,
    text: '',
    images: { small: '/s.jpg', large: '/l.jpg' },
    sets: [],
    ...overrides,
  };
}

function emptyLists(): DeckCardLists {
  return { main: [], extra: [], side: [], skillId: null };
}

const blueEyes = card({ id: 89631139, name: 'Blue-Eyes White Dragon', type: 'Normal Monster' });
const stardust = card({ id: 64366838, name: 'Stardust Dragon', type: 'Synchro Monster' });
const polymerization = card({ id: 24094653, name: 'Polymerization', type: 'Spell Card' });

describe('isExtraDeckMonster', () => {
  it('treats Fusion, Synchro, Xyz, and Link as Extra, including Pendulum forms', () => {
    expect(isExtraDeckMonster(stardust)).toBe(true);
    expect(isExtraDeckMonster(card({ id: 1, name: 'Link', type: 'Link Monster' }))).toBe(true);
    expect(isExtraDeckMonster(card({ id: 2, name: 'Xyz', type: 'XYZ Monster' }))).toBe(true);
    expect(isExtraDeckMonster(card({ id: 3, name: 'Fusion', type: 'Fusion Monster' }))).toBe(true);
    expect(
      isExtraDeckMonster(
        card({ id: 4, name: 'Pend Synchro', type: 'Synchro Pendulum Effect Monster' }),
      ),
    ).toBe(true);
    expect(isExtraDeckMonster(card({ id: 5, name: 'Pend', type: 'Pendulum Effect Monster' }))).toBe(
      false,
    );
    expect(isExtraDeckMonster(polymerization)).toBe(false);
    expect(isExtraDeckMonster(card({ id: 6, name: 'Skill', type: 'Skill Card' }))).toBe(false);
    expect(isExtraDeckMonster(blueEyes)).toBe(false);
  });
});

describe('addCardToDeck', () => {
  it('sends an Extra Deck monster to Extra and refuses Main', () => {
    const lists = emptyLists();
    const added = addCardToDeck(stardust, 'auto', 'advanced', lists);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.placedIn).toBe('extra');
    expect(added.lists.extra).toEqual([stardust.id]);
    expect(added.lists.main).toEqual([]);
    expect(lists.extra).toEqual([]);

    const refused = addCardToDeck(stardust, 'main', 'advanced', emptyLists());
    expect(refused.ok).toBe(false);
    if (refused.ok) return;
    expect(refused.message).toMatch(/not Main/);
  });

  it('puts a dropped Extra Deck monster in Extra or Side when that section is the target', () => {
    const extra = addCardToDeck(stardust, 'extra', 'advanced', emptyLists());
    expect(extra.ok).toBe(true);
    if (!extra.ok) return;
    expect(extra.lists.extra).toEqual([stardust.id]);

    const side = addCardToDeck(stardust, 'side', 'advanced', emptyLists());
    expect(side.ok).toBe(true);
    if (!side.ok) return;
    expect(side.lists.side).toEqual([stardust.id]);
    expect(side.lists.main).toEqual([]);
  });

  it('refuses a Genesys Link monster instead of placing it in Main', () => {
    const link = card({ id: 1861629, name: 'Decode Talker', type: 'Link Monster' });
    const lists = emptyLists();
    const result = addCardToDeck(link, 'auto', 'genesys', lists);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/Link Monsters are not allowed in Genesys/);
    expect(lists.main).toEqual([]);
    expect(lists.extra).toEqual([]);
  });

  it('refuses spells in the Extra Deck and allows them in Main and Side', () => {
    const extra = addCardToDeck(polymerization, 'extra', 'advanced', emptyLists());
    expect(extra.ok).toBe(false);
    if (extra.ok) return;
    expect(extra.message).toMatch(/cannot go in the Extra Deck/);

    const main = addCardToDeck(polymerization, 'auto', 'advanced', emptyLists());
    expect(main.ok).toBe(true);
    if (!main.ok) return;
    expect(main.lists.main).toEqual([polymerization.id]);

    const side = addCardToDeck(polymerization, 'side', 'advanced', emptyLists());
    expect(side.ok).toBe(true);
    if (!side.ok) return;
    expect(side.lists.side).toEqual([polymerization.id]);
  });

  it('refuses a card once the Extra Deck is full', () => {
    const lists = emptyLists();
    lists.extra = Array.from({ length: 15 }, (_, index) => index + 10);
    const result = addCardToDeck(stardust, 'extra', 'advanced', lists);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/Extra Deck cannot exceed 15/);
  });

  it('stops at the format copy limit across sections', () => {
    let lists = emptyLists();
    lists = {
      ...lists,
      main: [blueEyes.id, blueEyes.id],
      side: [blueEyes.id],
    };
    const result = addCardToDeck(blueEyes, 'main', 'advanced', lists);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/maximum copies/);
  });

  it('sets a Speed Duel Skill from Auto and refuses a second Skill or a Main drop', () => {
    const skill = card({
      id: 300302050,
      name: 'HEROES UNITE - FUSION!!',
      type: 'Skill Card',
      speedDuelLegal: true,
    });
    const other = card({
      id: 300302022,
      name: 'Ancient Fusion',
      type: 'Skill Card',
      speedDuelLegal: true,
    });

    const set = addCardToDeck(skill, 'auto', 'speed-duel', emptyLists());
    expect(set.ok).toBe(true);
    if (!set.ok) return;
    expect(set.placedIn).toBe('skill');
    expect(set.lists.skillId).toBe(skill.id);
    expect(set.lists.main).toEqual([]);

    const dropped = addCardToDeck(skill, 'main', 'speed-duel', emptyLists());
    expect(dropped.ok).toBe(false);
    if (dropped.ok) return;
    expect(dropped.message).toMatch(/Skill slot/);

    const second = addCardToDeck(other, 'auto', 'speed-duel', set.lists);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.message).toMatch(/one active Skill/);

    const advanced = addCardToDeck(skill, 'auto', 'advanced', emptyLists());
    expect(advanced.ok).toBe(false);
    if (advanced.ok) return;
    expect(advanced.message).toMatch(/only used in Speed Duel/);
  });
});

describe('deck copy edits', () => {
  it('groups repeated ids and removes one copy from the chosen zone', () => {
    const lists: DeckCardLists = {
      main: [blueEyes.id, blueEyes.id, stardust.id],
      extra: [stardust.id],
      side: [],
      skillId: null,
    };
    expect(groupZoneCardIds(lists.main)).toEqual([
      { cardId: blueEyes.id, qty: 2 },
      { cardId: stardust.id, qty: 1 },
    ]);
    expect(deckCopyCount(blueEyes.id, lists)).toBe(2);
    expect(deckCopyCount(stardust.id, lists)).toBe(2);

    const removed = removeOneCardFromZone(lists, 'main', blueEyes.id);
    expect(removed?.main).toEqual([blueEyes.id, stardust.id]);

    const fromLibrary = removeOneLibraryCopy(stardust, 'auto', lists);
    expect(fromLibrary?.lists.extra).toEqual([]);
    expect(fromLibrary?.lists.main).toEqual(lists.main);
  });

  it('moves one copy when the destination allows it and leaves the deck alone when it does not', () => {
    const lists: DeckCardLists = {
      main: [blueEyes.id, blueEyes.id],
      extra: [],
      side: [],
      skillId: null,
    };
    const moved = moveCardBetweenZones(blueEyes, 'main', 'side', 'advanced', lists);
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.lists.main).toEqual([blueEyes.id]);
    expect(moved.lists.side).toEqual([blueEyes.id]);

    const refused = moveCardBetweenZones(stardust, 'extra', 'main', 'advanced', {
      ...emptyLists(),
      extra: [stardust.id],
    });
    expect(refused.ok).toBe(false);
    if (refused.ok) return;
    expect(refused.message).toMatch(/Extra Deck monster/);
  });
});
