import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

import { focusRingClass } from './classes.ts';

/** Small labeled card. Same chrome as the card-detail stat chips. */
export const infoCardClass =
  'flex min-w-0 flex-col gap-0.5 rounded-md border border-border bg-surface px-3 py-2 text-sm';

const infoCardLinkClass = `${infoCardClass} text-inherit no-underline transition-colors hover:bg-surface-2 ${focusRingClass}`;

export function InfoCard({
  label,
  children,
  className,
  to,
  ariaLabel,
  singleLine = false,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  to?: LinkProps['to'];
  ariaLabel?: string;
  /** Keep the value on one line. The grid must be wide enough that it still fits. */
  singleLine?: boolean;
}) {
  const classNames = [to ? infoCardLinkClass : infoCardClass, className].filter(Boolean).join(' ');
  const body = (
    <>
      <dt className="text-xs font-medium text-text-2">{label}</dt>
      <dd
        className={['font-medium text-heading', singleLine ? 'whitespace-nowrap' : 'min-w-0'].join(
          ' ',
        )}
      >
        {children}
      </dd>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classNames} aria-label={ariaLabel} data-info-card="">
        {body}
      </Link>
    );
  }
  return (
    <div className={classNames} data-info-card="">
      {body}
    </div>
  );
}
