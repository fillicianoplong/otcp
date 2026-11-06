import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

import { cardTileFrameClass, cardTileLinkClass } from './classes.ts';

type CardTileProps = {
  to: LinkProps['to'];
  state?: LinkProps['state'];
  label: string;
  onClick?: () => void;
  children: ReactNode;
};

/** Catalog grid tile: a link around art, badges, and nothing else. */
export function CardTile({ to, state, label, onClick, children }: CardTileProps) {
  return (
    <li>
      <Link
        to={to}
        state={state}
        onClick={onClick}
        aria-label={label}
        className={cardTileLinkClass}
      >
        {children}
      </Link>
    </li>
  );
}

export function CardTileFrame({ children }: { children: ReactNode }) {
  return <div className={cardTileFrameClass}>{children}</div>;
}
