import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

import { linkedRowClass, listRowLinkClass, thumbClass } from './classes.ts';

type ListRowProps = {
  to: LinkProps['to'];
  state?: LinkProps['state'];
  label: string;
  onClick?: () => void;
  children: ReactNode;
};

/** Search list row: thumbnail, name, and the desktop stat columns. */
export function ListRow({ to, state, label, onClick, children }: ListRowProps) {
  return (
    <li>
      <Link to={to} state={state} onClick={onClick} aria-label={label} className={listRowLinkClass}>
        {children}
      </Link>
    </li>
  );
}

type LinkedRowProps = {
  children: ReactNode;
  className?: string;
} & (
  | { to: LinkProps['to']; href?: never; label: string }
  | { href: string; to?: never; label: string; external?: boolean }
);

/** One tappable row inside a bordered stack (prices, sets). */
export function LinkedRow({ children, className, label, ...target }: LinkedRowProps) {
  const classNames = [linkedRowClass, className].filter(Boolean).join(' ');
  if ('href' in target && target.href) {
    return (
      <a
        href={target.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={classNames}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={target.to!} aria-label={label} className={classNames}>
      {children}
    </Link>
  );
}

export function ListThumb({ children }: { children: ReactNode }) {
  return <div className={thumbClass}>{children}</div>;
}
