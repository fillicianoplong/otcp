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

export const formatBanlistSnapshotSchema = z
  .object({
    formatId: z.enum(['goat', 'hat', 'tengu']),
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
  })
  .strict();

export type FormatBanlistSnapshot = z.infer<typeof formatBanlistSnapshotSchema>;
export type BanlistSnapshotCard = z.infer<typeof banlistSnapshotCardSchema>;
