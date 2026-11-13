import { z } from 'zod';

import { otcpCardCoreSchema } from './core.ts';
import { yugiohCardExtensionSchema } from './yugioh.ts';

export const yugiohCardSchema = otcpCardCoreSchema.merge(yugiohCardExtensionSchema).strict();

export type YugiohCard = z.infer<typeof yugiohCardSchema>;
