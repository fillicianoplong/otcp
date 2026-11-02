import { publicDataUrl } from './paths.ts';
import type { BanDisplayStatus } from './formatBanContext.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { catalogTableColumnLabel } from './catalogTableColumns.ts';
import { catalogTableRaceOrPropertyCell } from './catalogTableColumns.ts';

export type YgoIconTier = 'row' | 'detail';

const ATTRIBUTE_FILES: Record<string, string> = {
  DARK: 'attr-dark.png',
  LIGHT: 'attr-light.png',
  EARTH: 'attr-earth.png',
  WATER: 'attr-water.png',
  FIRE: 'attr-fire.png',
  WIND: 'attr-wind.png',
  DIVINE: 'attr-divine.png',
};

const SPELL_TRAP_PROPERTY_FILES: Record<string, string> = {
  Normal: 'prop-normal.png',
  Continuous: 'prop-continuous.png',
  'Quick-Play': 'prop-quick-play.png',
  Equip: 'prop-equip.png',
  Field: 'prop-field.png',
  Ritual: 'prop-ritual.png',
  Counter: 'prop-counter.png',
};

/** Monster race ids (kebab-case) aligned with `docs/images/ui/icons/race/`. */
const MONSTER_RACE_FILES: Record<string, string> = {
  aqua: 'race-aqua.png',
  beast: 'race-beast.png',
  'beast-warrior': 'race-beast-warrior.png',
  cyberse: 'race-cyberse.png',
  dinosaur: 'race-dinosaur.png',
  'divine-beast': 'race-divine-beast.png',
  dragon: 'race-dragon.png',
  fairy: 'race-fairy.png',
  fiend: 'race-fiend.png',
  fish: 'race-fish.png',
  illusion: 'race-illusion.png',
  insect: 'race-insect.png',
  machine: 'race-machine.png',
  plant: 'race-plant.png',
  psychic: 'race-psychic.png',
  pyro: 'race-pyro.png',
  reptile: 'race-reptile.png',
  rock: 'race-rock.png',
  'sea-serpent': 'race-sea-serpent.png',
  spellcaster: 'race-spellcaster.png',
  thunder: 'race-thunder.png',
  warrior: 'race-warrior.png',
  'winged-beast': 'race-winged-beast.png',
  wyrm: 'race-wyrm.png',
  zombie: 'race-zombie.png',
};

const BAN_STATUS_FILES: Record<BanDisplayStatus, string> = {
  Forbidden: 'ban-forbidden.png',
  Limited: 'ban-limited.png',
  'Semi-Limited': 'ban-semi-limited.png',
};

export function ygoRaceIdFromDatasetValue(race: string | null | undefined): string | null {
  if (!race) return null;
  const id = race.trim().toLowerCase().replace(/\s+/g, '-');
  return MONSTER_RACE_FILES[id] ? id : null;
}

export function ygoIconPublicPath(fileName: string, tier: YgoIconTier = 'row'): string {
  return publicDataUrl(`public/icons/${tier}/${fileName}`);
}

export function resolveYgoAttributeIconPath(
  attribute: string | null | undefined,
  tier: YgoIconTier = 'row',
): string | null {
  if (!attribute) return null;
  const file = ATTRIBUTE_FILES[attribute.trim().toUpperCase()];
  if (!file) return null;
  return ygoIconPublicPath(file, tier);
}

export function resolveYgoMonsterRaceIconPath(
  race: string | null | undefined,
  tier: YgoIconTier = 'row',
): string | null {
  const id = ygoRaceIdFromDatasetValue(race);
  if (!id) return null;
  return ygoIconPublicPath(MONSTER_RACE_FILES[id], tier);
}

export function resolveYgoSpellTrapPropertyIconPath(
  property: string | null | undefined,
  tier: YgoIconTier = 'row',
): string | null {
  if (!property) return null;
  const trimmed = property.trim();
  const file = SPELL_TRAP_PROPERTY_FILES[trimmed];
  if (!file) return null;
  return ygoIconPublicPath(file, tier);
}

export function resolveYgoLevelStarIconPath(tier: YgoIconTier = 'row'): string {
  return ygoIconPublicPath('level.png', tier);
}

export function resolveYgoRankStarIconPath(tier: YgoIconTier = 'row'): string {
  return ygoIconPublicPath('rank.png', tier);
}

export function resolveYgoLinkMarkerIconPath(tier: YgoIconTier = 'row'): string {
  return ygoIconPublicPath('link-base.png', tier);
}

export function resolveYgoAtkIconPath(tier: YgoIconTier = 'row'): string {
  return ygoIconPublicPath('atk.png', tier);
}

export function resolveYgoDefIconPath(tier: YgoIconTier = 'row'): string {
  return ygoIconPublicPath('def.png', tier);
}

export function resolveYgoBanStatusIconPath(
  status: BanDisplayStatus,
  tier: YgoIconTier = 'row',
): string {
  return ygoIconPublicPath(BAN_STATUS_FILES[status], tier);
}

export function resolveYgoSpellCardTypeIconPath(tier: YgoIconTier = 'row'): string {
  return ygoIconPublicPath('frame-spell.png', tier);
}

export function resolveYgoTrapCardTypeIconPath(tier: YgoIconTier = 'row'): string {
  return ygoIconPublicPath('frame-trap.png', tier);
}

function isSpellOrTrapCard(card: YugiohCard): boolean {
  return card.type.includes('Spell') || card.type.includes('Trap');
}

export function resolveListRowTypeIconPath(card: YugiohCard): string | null {
  if (isSpellOrTrapCard(card)) {
    const property = card.type.startsWith('Quick-Play') ? 'Quick-Play' : card.race?.trim();
    return resolveYgoSpellTrapPropertyIconPath(property, 'row');
  }
  return resolveYgoMonsterRaceIconPath(card.race, 'row');
}

export function resolveListRowLevelIconPath(card: YugiohCard): string | null {
  if (isSpellOrTrapCard(card)) return null;
  if (card.linkRating != null) return resolveYgoLinkMarkerIconPath('row');
  if (card.rank != null) return resolveYgoRankStarIconPath('row');
  if (card.level != null) return resolveYgoLevelStarIconPath('row');
  return null;
}

export function resolveCardDetailChipIconPath(chipLabel: string, card: YugiohCard): string | null {
  const attributeLabel = catalogTableColumnLabel('attribute');
  const typeLabel = catalogTableColumnLabel('type');
  const atkLabel = catalogTableColumnLabel('atk');
  const defLabel = catalogTableColumnLabel('def');
  const levelLabels = new Set(['Level', 'Rank', 'Link']);
  const cardTypeLabel = catalogTableColumnLabel('cardType');

  if (chipLabel === attributeLabel) {
    return resolveYgoAttributeIconPath(card.attribute, 'detail');
  }
  if (chipLabel === typeLabel) {
    if (isSpellOrTrapCard(card)) {
      return resolveYgoSpellTrapPropertyIconPath(catalogTableRaceOrPropertyCell(card), 'detail');
    }
    return resolveYgoMonsterRaceIconPath(card.race, 'detail');
  }
  if (chipLabel === atkLabel) {
    if (isSpellOrTrapCard(card)) return null;
    return resolveYgoAtkIconPath('detail');
  }
  if (chipLabel === defLabel) {
    if (isSpellOrTrapCard(card) || card.linkRating != null) return null;
    return resolveYgoDefIconPath('detail');
  }
  if (levelLabels.has(chipLabel)) {
    if (card.linkRating != null) return resolveYgoLinkMarkerIconPath('detail');
    if (card.rank != null) return resolveYgoRankStarIconPath('detail');
    if (card.level != null) return resolveYgoLevelStarIconPath('detail');
    return null;
  }
  if (chipLabel === cardTypeLabel) {
    if (card.type.includes('Spell')) return resolveYgoSpellCardTypeIconPath('detail');
    if (card.type.includes('Trap')) return resolveYgoTrapCardTypeIconPath('detail');
  }
  return null;
}

/** @internal Exported for unit tests. */
export const ygoIconMapExportsForTests = {
  ATTRIBUTE_FILES,
  SPELL_TRAP_PROPERTY_FILES,
  MONSTER_RACE_FILES,
  BAN_STATUS_FILES,
};
