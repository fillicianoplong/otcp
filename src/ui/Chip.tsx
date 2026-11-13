import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { chipClass } from './classes.ts';

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: ReactNode;
  removeLabel: string;
};

/** Removable filter chip. Same height and padding as the toolbar buttons. */
export function Chip({ label, removeLabel, className, type = 'button', ...props }: ChipProps) {
  return (
    <button type={type} className={[chipClass, className].filter(Boolean).join(' ')} {...props}>
      <span className="truncate">{label}</span>
      <span aria-hidden="true" className="text-text-2">
        ×
      </span>
      <span className="sr-only">{removeLabel}</span>
    </button>
  );
}
