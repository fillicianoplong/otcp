import { z } from 'zod';

import { OTCP_DATASET_SCHEMA_VERSION_LEGACY } from './constants.ts';
import { yugiohCardSchema } from './card.ts';
import { setIndexSchema } from './setIndex.ts';

export const datasetEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(OTCP_DATASET_SCHEMA_VERSION_LEGACY),
    generatedAt: z.iso.datetime(),
    source: z.string().min(1),
    cards: z.array(yugiohCardSchema),
    setIndex: setIndexSchema.optional(),
  })
  .strict();

export type DatasetEnvelope = z.infer<typeof datasetEnvelopeSchema>;
