import { describe, expect, it } from 'vitest';

import {
  catalogTableArchetypeCell,
  catalogTableAttributeCell,
  catalogTableCardTypeCell,
  catalogTableColumnLabel,
  catalogTableLevelCell,
  catalogTableRaceOrPropertyCell,
  CATALOG_TABLE_OPTIONAL_COLUMN_DEFS,
  CATALOG_TABLE_SORTABLE_COLUMN_DEFS,
} from '../../src/catalog/catalogTableColumns.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import monster from '../fixtures/schema/monster-normal.json';
import spell from '../fixtures/schema/spell.json';

describe('catalogTableColumns', () => {
  it('defines a human-readable label for every sortable column', () => {
    const forbiddenRawLabels = new Set([
      'cardType',
      'frameType',
      'race',
      'attribute',
      'level',
      'price',
      'archetype',
      'name',
      'type',
      'ban',
    ]);

    for (const column of CATALOG_TABLE_SORTABLE_COLUMN_DEFS) {
      expect(column.label.trim().length).toBeGreaterThan(0);
      expect(catalogTableColumnLabel(column.id)).toBe(column.label);
      expect(forbiddenRawLabels.has(column.label)).toBe(false);
      if (column.id === 'atk' || column.id === 'def') {
        expect(column.label).toBe(column.id.toUpperCase());
      } else {
        expect(column.label).not.toBe(column.id);
      }
    }

    expect(CATALOG_TABLE_OPTIONAL_COLUMN_DEFS.map((column) => column.label)).toEqual([
      'Card type',
      'Attribute',
      'Type',
      'Level',
      'ATK',
      'DEF',
      'Archetype',
      'Price',
    ]);
  });

  it('splits card type, attribute, and race into separate single-value cells', () => {
    const card = monster as YugiohCard;
    expect(catalogTableCardTypeCell(card)).toBe('Normal Monster');
    expect(catalogTableAttributeCell(card)).toBe('DARK');
    expect(catalogTableRaceOrPropertyCell(card)).toBe('Spellcaster');
    expect(catalogTableLevelCell(card)).toBe('7');
    expect(catalogTableCardTypeCell(card)).not.toContain('·');
    expect(catalogTableRaceOrPropertyCell(card)).not.toContain('·');
  });

  it('uses spell property for the Type column and em dash for attribute and level', () => {
    const quickPlay: YugiohCard = {
      ...(spell as YugiohCard),
      type: 'Quick-Play Spell Card',
      race: 'Normal',
    };
    expect(catalogTableCardTypeCell(quickPlay)).toBe('Quick-Play Spell Card');
    expect(catalogTableRaceOrPropertyCell(quickPlay)).toBe('Quick-Play');
    expect(catalogTableAttributeCell(quickPlay)).toBe('—');
    expect(catalogTableLevelCell(quickPlay)).toBe('—');
  });

  it('formats archetype or em dash when missing', () => {
    const withArchetype = { ...(monster as YugiohCard), archetype: 'Test Archetype' };
    expect(catalogTableArchetypeCell(withArchetype)).toBe('Test Archetype');
    const withoutArchetype = { ...(monster as YugiohCard), archetype: undefined };
    expect(catalogTableArchetypeCell(withoutArchetype)).toBe('—');
  });
});
