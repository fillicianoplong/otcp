import type { ReactNode } from 'react';

import { pageTitleClass } from './classes.ts';

export function PageTitle({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <h1 id={id} className={[pageTitleClass, className].filter(Boolean).join(' ')}>
      {children}
    </h1>
  );
}
