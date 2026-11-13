import type { InputHTMLAttributes } from 'react';

import { focusRingClass, inputClass, inputCompactClass, inputInsetClass } from './classes.ts';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Touch-height field, the shorter toolbar field, or a page-title field. */
  field?: 'touch' | 'inset' | 'compact' | 'title';
};

const FIELD_CLASS = {
  touch: inputClass,
  inset: inputInsetClass,
  compact: inputCompactClass,
  title: `min-h-touch w-full rounded-md border border-border bg-bg px-3 text-2xl font-semibold text-heading ${focusRingClass}`,
} as const;

export function Input({ field = 'touch', className, ...props }: InputProps) {
  return <input className={[FIELD_CLASS[field], className].filter(Boolean).join(' ')} {...props} />;
}
