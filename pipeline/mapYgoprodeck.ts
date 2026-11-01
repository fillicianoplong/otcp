import {
  OTCP_CARD_SCHEMA_VERSION,
  OTCP_DATASET_SCHEMA_VERSION,
  type CardPrices,
  type CardSet,
  type DatasetEnvelope,
  type YugiohCard,
} from '../src/shared/schema/index.ts';
import { YGOPRODECK_CARDINFO_URL } from './constants.ts';
import { sameOriginImagePaths } from './imagePaths.ts';
import type { YgoApiCard, YgoBanlistInfo } from './ygoprodeckTypes.ts';

const BAN_VALUES = new Set(['Forbidden', 'Limited', 'Semi-Limited']);

const YGO_ATTRIBUTES = new Set(['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE']);

function isYgoAttribute(value: string): value is NonNullable<YugiohCard['attribute']> {
  return YGO_ATTRIBUTES.has(value);
}

function normalizeText(desc: string | undefined): string {
  return (desc ?? '').replaceAll('\r\n', '\n').replaceAll('\r', '\n');
}

function parseOptionalPrice(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : undefined;
}

function mapBanField(
  raw: string | undefined,
): 'Forbidden' | 'Limited' | 'Semi-Limited' | undefined {
  if (!raw || !BAN_VALUES.has(raw)) return undefined;
  return raw as 'Forbidden' | 'Limited' | 'Semi-Limited';
}

function mapBanlistInfo(info: YgoBanlistInfo | undefined): YugiohCard['banlistInfo'] {
  if (!info) return undefined;
  const banTcg = mapBanField(info.ban_tcg);
  const banOcg = mapBanField(info.ban_ocg);
  const banGoat = mapBanField(info.ban_goat);
  if (!banTcg && !banOcg && !banGoat) return undefined;
  return {
    ...(banTcg ? { banTcg } : {}),
    ...(banOcg ? { banOcg } : {}),
    ...(banGoat ? { banGoat } : {}),
  };
}

function mapSets(card: YgoApiCard): CardSet[] {
  return (card.card_sets ?? []).map((set) => {
    const mapped: CardSet = {
      setCode: set.set_code,
      setName: set.set_name,
      setRarity: set.set_rarity,
    };
    if (set.set_rarity_code && set.set_rarity_code.length > 0) {
      mapped.setRarityCode = set.set_rarity_code;
    }
    const setPrice = parseOptionalPrice(set.set_price);
    if (setPrice !== undefined) mapped.setPrice = setPrice;
    return mapped;
  });
}

function mapPrices(card: YgoApiCard): CardPrices | undefined {
  const row = card.card_prices?.[0];
  if (!row) return undefined;
  const prices: CardPrices = {};
  const tcg = parseOptionalPrice(row.tcgplayer_price);
  const cm = parseOptionalPrice(row.cardmarket_price);
  const ebay = parseOptionalPrice(row.ebay_price);
  const amazon = parseOptionalPrice(row.amazon_price);
  const csi = parseOptionalPrice(row.coolstuffinc_price);
  if (tcg !== undefined) prices.tcgplayer = tcg;
  if (cm !== undefined) prices.cardmarket = cm;
  if (ebay !== undefined) prices.ebay = ebay;
  if (amazon !== undefined) prices.amazon = amazon;
  if (csi !== undefined) prices.coolstuffinc = csi;
  return Object.keys(prices).length > 0 ? prices : undefined;
}

function sameOriginImages(cardId: number): YugiohCard['images'] {
  return sameOriginImagePaths(cardId);
}

/** Drop Rush Duel and other rows outside the v1 Yu-Gi-Oh! extension (FR-50). */
export function isSupportedYugiohRow(card: YgoApiCard): boolean {
  const type = card.type ?? '';
  if (type.includes('Rush')) return false;
  if (type === 'Spell Card' || type === 'Trap Card' || type === 'Skill Card') return true;
  return type.includes('Monster');
}

export function mapYgoprodeckCard(card: YgoApiCard): YugiohCard {
  const mapped: YugiohCard = {
    schemaVersion: OTCP_CARD_SCHEMA_VERSION,
    id: card.id,
    name: card.name,
    type: card.type ?? '',
    text: normalizeText(card.desc),
    images: sameOriginImages(card.id),
    sets: mapSets(card),
  };

  const prices = mapPrices(card);
  if (prices) mapped.prices = prices;

  mapped.passcode = card.id;

  if (card.attribute && isYgoAttribute(card.attribute)) mapped.attribute = card.attribute;
  if (typeof card.level === 'number') mapped.level = card.level;
  if (typeof card.rank === 'number') mapped.rank = card.rank;
  if (typeof card.linkval === 'number') mapped.linkRating = card.linkval;
  if (card.linkmarkers && card.linkmarkers.length > 0) mapped.linkMarkers = [...card.linkmarkers];
  if (typeof card.atk === 'number') mapped.atk = card.atk;
  if (typeof card.def === 'number') mapped.def = card.def;
  if (card.race) mapped.race = card.race;
  if (card.archetype) mapped.archetype = card.archetype;
  if (typeof card.scale === 'number') mapped.scale = card.scale;
  if (typeof card.genesys_points === 'number') mapped.genesysPoints = card.genesys_points;

  const banlistInfo = mapBanlistInfo(card.banlist_info);
  if (banlistInfo) mapped.banlistInfo = banlistInfo;

  return mapped;
}

export function buildDatasetEnvelope(cards: YugiohCard[], generatedAt: string): DatasetEnvelope {
  return {
    schemaVersion: OTCP_DATASET_SCHEMA_VERSION,
    generatedAt,
    source: YGOPRODECK_CARDINFO_URL,
    cards,
  };
}

export function mapYgoprodeckResponse(rows: YgoApiCard[]): {
  cards: YugiohCard[];
  skipped: number;
} {
  const cards: YugiohCard[] = [];
  let skipped = 0;
  for (const row of rows) {
    if (!isSupportedYugiohRow(row)) {
      skipped += 1;
      continue;
    }
    cards.push(mapYgoprodeckCard(row));
  }
  return { cards, skipped };
}
