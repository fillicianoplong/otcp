import type { ReactNode } from 'react';

export const FORMAT_FILTER_SECTION_ID = 'format';

export function CollapsibleFilterSection({
  title,
  collapsed,
  onToggleCollapse,
  children,
  className,
}: {
  title: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  children: ReactNode;
  className?: string;
}) {
  const extraClassName = className?.trim() ?? '';
  const clipsOverflow = !/(?:^|\s)overflow-/.test(extraClassName);
  return (
    <section
      className={`${clipsOverflow ? 'overflow-hidden ' : ''}rounded-lg border border-border bg-surface${extraClassName ? ` ${extraClassName}` : ''}`}
    >
      <button
        type="button"
        className={`flex min-h-10 w-full items-center justify-between gap-2 bg-surface-2 px-3 py-2 text-left text-sm font-medium text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong ${collapsed ? 'rounded-lg' : 'rounded-t-lg'}`}
        aria-expanded={!collapsed}
        onClick={onToggleCollapse}
      >
        <span className="min-w-0 truncate">{title}</span>
        <span aria-hidden="true" className="shrink-0 text-text-2">
          {collapsed ? '▸' : '▾'}
        </span>
      </button>
      {!collapsed ? <div className="rounded-lg px-3 py-3">{children}</div> : null}
    </section>
  );
}
