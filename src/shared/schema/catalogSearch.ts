import { z } from 'zod';

import { OTCP_DATASET_SCHEMA_VERSION } from './constants.ts';
import { cardPricesSchema, cardSetSchema, otcpCardCoreSchema } from './core.ts';
import { yugiohCardExtensionSchema } from './yugioh.ts';
import { setIndexSchema } from './setIndex.ts';

const catalogSearchImageSchema = z
  .object({
    small: z.string().min(1),
  })
  .strict();

const catalogSearchExtensionSchema = yugiohCardExtensionSchema
  .omit({
    pendDesc: true,
    monsterDesc: true,
    scale: true,
    genesysPoints: true,
  })
  .strict();

/** Card fields required for Search, filters, grid, list, and table. */
export const catalogSearchCardSchema = otcpCardCoreSchema
  .omit({ schemaVersion: true, sets: true, text: true })
  .merge(catalogSearchExtensionSchema)
  .extend({
    text: z.string().optional(),
    images: catalogSearchImageSchema.optional(),
    setNames: z.array(z.string().min(1)),
    rarities: z.array(z.string().min(1)),
    prices: cardPricesSchema.optional(),
    detailBucket: z.number().int().nonnegative(),
    artIds: z.array(z.number().int().positive()).min(1).optional(),
  })
  .strict();

export type CatalogSearchCard = z.infer<typeof catalogSearchCardSchema>;

export const searchIndexEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(OTCP_DATASET_SCHEMA_VERSION),
    generatedAt: z.iso.datetime(),
    source: z.string().min(1),
    cards: z.array(catalogSearchCardSchema),
    setIndex: setIndexSchema.optional(),
  })
  .strict();

export type SearchIndexEnvelope = z.infer<typeof searchIndexEnvelopeSchema>;

export const catalogDetailOverlaySchema = z
  .object({
    text: z.string().optional(),
    sets: z.array(cardSetSchema).optional(),
    pendDesc: z.string().min(1).optional(),
    monsterDesc: z.string().min(1).optional(),
    scale: z.number().int().min(0).max(13).optional(),
    genesysPoints: z.number().int().min(0).optional(),
    artIds: z.array(z.number().int().positive()).min(1).optional(),
  })
  .strict();

export type CatalogDetailOverlay = z.infer<typeof catalogDetailOverlaySchema>;

export const detailChunkSchema = z
  .object({
    schemaVersion: z.literal(OTCP_DATASET_SCHEMA_VERSION),
    bucket: z.number().int().nonnegative(),
    cards: z.record(z.string(), catalogDetailOverlaySchema),
  })
  .strict();

export type DetailChunk = z.infer<typeof detailChunkSchema>;

export function catalogSearchCardHasFacetSets(
  card: CatalogSearchCard,
): { setName: string; setRarity: string }[] {
  const pairs: { setName: string; setRarity: string }[] = [];
  for (let index = 0; index < card.setNames.length; index += 1) {
    pairs.push({
      setName: card.setNames[index]!,
      setRarity: card.rarities[index] ?? card.rarities[0] ?? 'Unknown',
    });
  }
  return pairs;
}

export function catalogSearchSetsForBrowse(
  card: CatalogSearchCard,
): z.infer<typeof cardSetSchema>[] {
  return catalogSearchCardHasFacetSets(card).map((entry, index) => ({
    setCode: `${card.id}-${index}`,
    setName: entry.setName,
    setRarity: entry.setRarity,
  }));
}
