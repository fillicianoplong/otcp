import { z } from 'zod';

const ygoAttributeSchema = z.enum(['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE']);

const banStatusSchema = z.enum(['Forbidden', 'Limited', 'Semi-Limited']);

export const yugiohBanlistInfoSchema = z
  .object({
    banTcg: banStatusSchema.optional(),
    banOcg: banStatusSchema.optional(),
    banGoat: banStatusSchema.optional(),
  })
  .strict();

/** Yu-Gi-Oh!-specific card fields composed with the shared core (ADR-002). */
export const yugiohCardExtensionSchema = z
  .object({
    passcode: z.number().int().positive().optional(),
    attribute: ygoAttributeSchema.optional(),
    level: z.number().int().min(0).max(13).optional(),
    rank: z.number().int().min(0).max(13).optional(),
    linkRating: z.number().int().min(1).max(8).optional(),
    linkMarkers: z.array(z.string().min(1)).optional(),
    atk: z.number().int().optional(),
    def: z.number().int().optional(),
    archetype: z.string().min(1).optional(),
    race: z.string().min(1).optional(),
    scale: z.number().int().min(0).max(13).optional(),
    banlistInfo: yugiohBanlistInfoSchema.optional(),
    genesysPoints: z.number().int().min(0).optional(),
  })
  .strict();

export type YugiohBanlistInfo = z.infer<typeof yugiohBanlistInfoSchema>;
export type YugiohCardExtension = z.infer<typeof yugiohCardExtensionSchema>;
