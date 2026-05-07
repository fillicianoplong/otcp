import { z } from 'zod';

export const setIndexEntrySchema = z
  .object({
    tcgDate: z.string().min(1).optional(),
    numOfCards: z.number().int().nonnegative().optional(),
  })
  .strict();

export type SetIndexEntry = z.infer<typeof setIndexEntrySchema>;

export const setIndexSchema = z.record(z.string(), setIndexEntrySchema);

export type SetIndex = z.infer<typeof setIndexSchema>;
