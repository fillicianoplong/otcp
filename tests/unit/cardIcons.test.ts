import { describe, expect, it } from 'vitest';

import {
  resolveCardDetailChipIconPath,
  resolveListRowTypeIconPath,
  resolveYgoAttributeIconPath,
  resolveYgoBanStatusIconPath,
  resolveYgoMonsterRaceIconPath,
  resolveYgoSpellTrapPropertyIconPath,
  ygoIconMapExportsForTests,
  ygoIconPublicPath,
  ygoRaceIdFromDatasetValue,
} from '../../src/catalog/cardIcons.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import monsterNormal from '../fixtures/schema/monster-normal.json';

describe('cardIcons', () => {
  it('maps every official attribute to a public icon URL', () => {
    for (const attribute of Object.keys(ygoIconMapExportsForTests.ATTRIBUTE_FILES)) {
      const path = resolveYgoAttributeIconPath(attribute);
      expect(path, attribute).toMatch(/icons\/row\/attr-/);
      expect(path).toBe(
        `${import.meta.env.BASE_URL}icons/row/${ygoIconMapExportsForTests.ATTRIBUTE_FILES[attribute]}`,
      );
    }
  });

  it('maps every spell and trap property to a public icon URL', () => {
    for (const property of Object.keys(ygoIconMapExportsForTests.SPELL_TRAP_PROPERTY_FILES)) {
      const path = resolveYgoSpellTrapPropertyIconPath(property);
      expect(path, property).toMatch(/icons\/row\/prop-/);
    }
  });

  it('maps every monster race to a public icon URL', () => {
    const datasetRaceForId = (id: string): string => {
      if (id === 'sea-serpent') return 'Sea Serpent';
      if (id === 'winged-beast') return 'Winged Beast';
      if (id === 'beast-warrior') return 'Beast-Warrior';
      if (id === 'divine-beast') return 'Divine-Beast';
      return id
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    };
    for (const raceId of Object.keys(ygoIconMapExportsForTests.MONSTER_RACE_FILES)) {
      const datasetRace = datasetRaceForId(raceId);
      expect(ygoRaceIdFromDatasetValue(datasetRace)).toBe(raceId);
      const path = resolveYgoMonsterRaceIconPath(datasetRace);
      expect(path, raceId).toMatch(/icons\/row\/race-/);
    }
  });

  it('maps every ban status to a public icon URL', () => {
    for (const status of Object.keys(ygoIconMapExportsForTests.BAN_STATUS_FILES)) {
      const path = resolveYgoBanStatusIconPath(status as 'Forbidden');
      expect(path, status).toMatch(/icons\/row\/ban-/);
    }
  });

  it('resolves list row type icons to monster race assets', () => {
    const path = resolveListRowTypeIconPath(monsterNormal as YugiohCard);
    expect(path).toMatch(/race-spellcaster/);
  });

  it('resolves detail type chips to monster race assets', () => {
    const path = resolveCardDetailChipIconPath('Type', monsterNormal as YugiohCard);
    expect(path).toMatch(/race-spellcaster/);
  });

  it('returns null for unknown attribute, property, and race values', () => {
    expect(resolveYgoAttributeIconPath('VOID')).toBeNull();
    expect(resolveYgoAttributeIconPath('')).toBeNull();
    expect(resolveYgoSpellTrapPropertyIconPath('Fusion')).toBeNull();
    expect(resolveYgoSpellTrapPropertyIconPath(undefined)).toBeNull();
    expect(resolveYgoMonsterRaceIconPath('Alien')).toBeNull();
  });

  it('respects the Vite base when building icon URLs', () => {
    expect(ygoIconPublicPath('level.png')).toBe(`${import.meta.env.BASE_URL}icons/row/level.png`);
    expect(ygoIconPublicPath('level.png', 'detail')).toBe(
      `${import.meta.env.BASE_URL}icons/detail/level.png`,
    );
    expect(ygoIconPublicPath('atk.png', 'detail')).toContain('icons/detail/atk.png');
  });
});
