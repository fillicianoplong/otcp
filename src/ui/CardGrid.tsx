import type { HTMLAttributes, ReactNode, Ref } from 'react';

import { cardGridClassName, type CardGridVariant } from './cardGridLayout.ts';

export type { CardGridVariant } from './cardGridLayout.ts';

type CardGridProps = HTMLAttributes<HTMLUListElement> & {
  variant: CardGridVariant;
  children: ReactNode;
  ref?: Ref<HTMLUListElement>;
};

export function CardGrid({ variant, className, children, ref, ...props }: CardGridProps) {
  return (
    <ul
      ref={ref}
      className={[cardGridClassName(variant), className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </ul>
  );
}
