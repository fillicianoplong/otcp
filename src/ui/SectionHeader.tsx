import type { ReactNode } from 'react';

import { groupTitleClass, sectionTitleClass } from './classes.ts';

type SectionHeaderProps = {
  id?: string;
  /** `section` is a page section. `group` is a block inside a page. */
  size?: 'section' | 'group';
  className?: string;
  visuallyHidden?: boolean;
  children: ReactNode;
};

export function SectionHeader({
  id,
  size = 'group',
  className,
  visuallyHidden = false,
  children,
}: SectionHeaderProps) {
  const sizeClass = visuallyHidden
    ? 'sr-only'
    : size === 'section'
      ? sectionTitleClass
      : groupTitleClass;
  return (
    <h2 id={id} className={[sizeClass, className].filter(Boolean).join(' ')}>
      {children}
    </h2>
  );
}
