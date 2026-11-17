import type { ReactNode } from 'react';

/**
 * Search on its own line, with an optional control at the end of that line
 * and a count directly under the field. The row below keeps leading controls
 * on the left and trailing controls on the right.
 */
export function Toolbar({
  search,
  filters,
  count,
  children,
  actions,
  className,
}: {
  search?: ReactNode;
  filters?: ReactNode;
  count?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={['flex flex-col gap-2', className].filter(Boolean).join(' ')}>
      {search ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">{search}</div>
            {filters}
          </div>
          {count != null ? (
            <p className="text-xs text-text-2" aria-live="polite">
              {count}
            </p>
          ) : null}
        </div>
      ) : null}
      {children || actions ? (
        <div className="flex items-center gap-2">
          {children}
          {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
