import type { ButtonHTMLAttributes } from 'react';

import { FilterIcon, ToolbarIconButton } from './ToolbarIconButton.tsx';

type FiltersToolbarButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  count?: number;
};

function filtersToolbarLabel(count: number): string {
  return count > 0 ? `Filters, ${count} active` : 'Filters';
}

/** Icon-only Filters control. Matches a view-toggle segment, with a count when filters are on. */
export function FiltersToolbarButton({
  count = 0,
  className,
  ...props
}: FiltersToolbarButtonProps) {
  return (
    <ToolbarIconButton
      label={filtersToolbarLabel(count)}
      className={['relative', className].filter(Boolean).join(' ')}
      {...props}
    >
      <FilterIcon />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-0 right-0 inline-flex h-3.5 min-w-3.5 translate-x-0.5 -translate-y-0.5 items-center justify-center rounded-full bg-heading px-0.5 text-2xs leading-none font-semibold text-on-accent tabular-nums"
        >
          {count}
        </span>
      ) : null}
    </ToolbarIconButton>
  );
}
