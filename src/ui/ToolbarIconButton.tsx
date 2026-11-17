import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

import { toolbarIconButtonClass } from './classes.ts';

type ToolbarIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Accessible name. Also used as the tooltip when `title` is omitted. */
  label: string;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

/** Square toolbar icon. Matches the view-toggle segment: height, border, radius, fill, hover, and focus. */
export function ToolbarIconButton({
  label,
  title,
  className,
  type = 'button',
  ref,
  children,
  ...props
}: ToolbarIconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={title ?? label}
      className={[toolbarIconButtonClass, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}

export function SearchIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none">
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FilterIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none">
      <path
        d="M2 4h12M4 8h8M6 12h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
