import type { z } from 'zod';

import type { YugiohCard } from './card.ts';
import { yugiohCardSchema } from './card.ts';
import type { DatasetEnvelope } from './dataset.ts';
import { datasetEnvelopeSchema } from './dataset.ts';

export type ValidationIssueCode =
  z.ZodIssue['code'] | 'unrecognized_keys' | 'invalid_union' | 'invalid_value';

export type ValidationIssue = {
  path: string;
  code: ValidationIssueCode;
  message: string;
};

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: ValidationIssue[] };

function issuesFromZodError(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    code: issue.code as ValidationIssueCode,
    message: issue.message,
  }));
}

export function validateYugiohCard(input: unknown): ValidationResult<YugiohCard> {
  const parsed = yugiohCardSchema.safeParse(input);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return { ok: false, errors: issuesFromZodError(parsed.error) };
}

export function validateDatasetEnvelope(input: unknown): ValidationResult<DatasetEnvelope> {
  const parsed = datasetEnvelopeSchema.safeParse(input);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return { ok: false, errors: issuesFromZodError(parsed.error) };
}
