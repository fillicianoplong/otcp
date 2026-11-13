import type { ReactNode } from 'react';

/**
 * Search on its own line, then Filters, chips, a count, and the view toggle.
 * Pages pass only the slots they use.
 */
export function Toolbar({
  search,
  children,
  actions,
  className,
}: {
  search?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={['flex flex-col gap-2', className].filter(Boolean).join(' ')}>
      {search}
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
