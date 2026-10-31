import { z } from 'zod';

import { OTCP_CARD_SCHEMA_VERSION } from './constants.ts';

export const cardImageSchema = z
  .object({
    small: z.string().min(1),
    large: z.string().min(1),
  })
  .strict();

export const cardSetSchema = z
  .object({
    setCode: z.string().min(1),
    setName: z.string().min(1),
    setRarity: z.string().min(1),
    setRarityCode: z.string().min(1).optional(),
    setPrice: z.number().optional(),
  })
  .strict();

export const cardPricesSchema = z
  .object({
    tcgplayer: z.number().optional(),
    cardmarket: z.number().optional(),
    ebay: z.number().optional(),
    amazon: z.number().optional(),
    coolstuffinc: z.number().optional(),
  })
  .strict();

/** Game-agnostic card fields shared across future OTCP extensions (FR-51). */
export const otcpCardCoreSchema = z
  .object({
    schemaVersion: z.literal(OTCP_CARD_SCHEMA_VERSION),
    id: z.number().int().positive(),
    name: z.string().min(1),
    type: z.string().min(1),
    text: z.string(),
    images: cardImageSchema,
    sets: z.array(cardSetSchema),
    prices: cardPricesSchema.optional(),
  })
  .strict();

export type CardImage = z.infer<typeof cardImageSchema>;
export type CardSet = z.infer<typeof cardSetSchema>;
export type CardPrices = z.infer<typeof cardPricesSchema>;
export type OtcpCardCore = z.infer<typeof otcpCardCoreSchema>;
