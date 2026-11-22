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

/** Picture frame with a mountain and sun. Marks set printings that use the artwork on screen. */
export function PictureIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none">
      <rect
        x="2"
        y="2.75"
        width="12"
        height="10.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="10.5" cy="6" r="1.25" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="m2.75 12 3.75-4.25 3 3.25 1.5-1.5 2.25 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
