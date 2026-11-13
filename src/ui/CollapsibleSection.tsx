import { useState, type ReactNode, type SyntheticEvent } from 'react';

import { focusRingClass } from './classes.ts';
import { SectionHeader } from './SectionHeader.tsx';

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0 text-text-2 transition-transform group-open:rotate-180"
      fill="none"
    >
      <path
        d="M4 6.5 8 10.5 12 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Named block that starts open. The header is the name, a count, and a chevron. */
export function CollapsibleSection({
  title,
  titleId,
  count,
  children,
  className,
}: {
  title: string;
  titleId?: string;
  count?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(true);

  const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    setOpen(event.currentTarget.open);
  };

  return (
    <section
      aria-labelledby={titleId}
      className={['overflow-hidden rounded-md border border-border bg-surface', className]
        .filter(Boolean)
        .join(' ')}
    >
      <details className="group" open={open} onToggle={onToggle}>
        <summary
          className={`flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden ${focusRingClass}`}
        >
          <SectionHeader id={titleId} className="min-w-0">
            {title}
          </SectionHeader>
          <span className="flex shrink-0 items-center gap-2">
            {count != null ? <span className="text-xs text-text-2">{count}</span> : null}
            <Chevron />
          </span>
        </summary>
        <div className="px-3 pb-3">{children}</div>
      </details>
    </section>
  );
}
