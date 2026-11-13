import { z } from 'zod';

const banlistCardStatusSchema = z.enum(['forbidden', 'limited', 'semi-limited']);

export const banlistSnapshotCardSchema = z
  .object({
    id: z.number().int().positive(),
    passcode: z.string().min(1),
    name: z.string().min(1),
    status: banlistCardStatusSchema,
    note: z.string(),
    uncertain: z.boolean().optional(),
  })
  .strict();

export const banlistPreviousListSchema = z
  .object({
    effectiveDate: z.string().min(1),
    listName: z.string().min(1),
    cards: z.array(banlistSnapshotCardSchema).min(1),
  })
  .strict();

export const formatBanlistSnapshotSchema = z
  .object({
    formatId: z.enum(['goat', 'hat', 'tengu', 'edison']),
    name: z.string().min(1),
    listName: z.string().min(1),
    effectiveDate: z.string().min(1),
    effectiveThrough: z.string().min(1).optional(),
    retrieved: z.string().min(1).optional(),
    sortDate: z.string().min(1),
    poolCutoffDate: z.string().min(1),
    poolCutoffSource: z.string().min(1),
    snapshotSourceUrl: z.string().min(1),
    source: z
      .object({
        name: z.string(),
        url: z.string(),
        statement: z.string().optional(),
      })
      .strict(),
    listWindowSource: z.record(z.string(), z.unknown()).optional(),
    cardPool: z.record(z.string(), z.unknown()).optional(),
    crossCheck: z.record(z.string(), z.unknown()).optional(),
    cards: z.array(banlistSnapshotCardSchema).min(1),
    /** Prior list in the same Konami lineage; powers change badges and No Longer Restricted. */
    previousList: banlistPreviousListSchema.optional(),
  })
  .strict();

export type FormatBanlistSnapshot = z.infer<typeof formatBanlistSnapshotSchema>;
export type BanlistPreviousList = z.infer<typeof banlistPreviousListSchema>;
export type BanlistSnapshotCard = z.infer<typeof banlistSnapshotCardSchema>;

const tcgBanlistSnapshotCardInputSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    status: banlistCardStatusSchema,
    passcode: z.union([z.string(), z.number()]).optional(),
    note: z.string().optional(),
    uncertain: z.boolean().optional(),
  })
  .strict();

export function normalizeTcgBanlistSnapshotCard(
  raw: z.infer<typeof tcgBanlistSnapshotCardInputSchema>,
): BanlistSnapshotCard {
  const passcode =
    raw.passcode == null || String(raw.passcode) === String(raw.id)
      ? String(raw.id)
      : String(raw.passcode);
  return {
    id: raw.id,
    passcode,
    name: raw.name,
    status: raw.status,
    note: raw.note ?? '',
    ...(raw.uncertain ? { uncertain: true } : {}),
  };
}

export const tcgBanlistGapSchema = z
  .object({
    name: z.string().min(1),
    status: z.enum(['forbidden', 'limited', 'semi-limited']),
    pageTitle: z.string().optional(),
  })
  .strict();

export const tcgBanlistSnapshotSchema = z
  .object({
    listName: z.string().min(1),
    effectiveDate: z.string().min(1),
    effectiveThrough: z.string().min(1).optional(),
    retrieved: z.string().min(1).optional(),
    sortDate: z.string().min(1),
    snapshotSourceUrl: z.string().min(1),
    source: z
      .object({
        name: z.string(),
        url: z.string(),
        statement: z.string().optional(),
      })
      .strict(),
    listWindowSource: z.record(z.string(), z.unknown()).optional(),
    cards: z.array(tcgBanlistSnapshotCardInputSchema),
    gaps: z.array(tcgBanlistGapSchema).optional(),
  })
  .strict()
  .transform((value) => ({
    ...value,
    cards: value.cards.map(normalizeTcgBanlistSnapshotCard),
  }));

export type TcgBanlistSnapshot = z.infer<typeof tcgBanlistSnapshotSchema>;
export type TcgBanlistGap = z.infer<typeof tcgBanlistGapSchema>;
