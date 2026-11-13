import type { HTMLAttributes, ReactNode } from 'react';

type PageWidth = 'full' | 'reading' | 'form';

const WIDTH_CLASS: Record<PageWidth, string> = {
  full: 'min-w-0 w-full',
  reading: 'mx-auto w-full min-w-0 max-w-reading',
  form: 'w-full md:mx-auto md:max-w-form',
};

/** Full-bleed page, a ~70ch reading column, or the narrow account form. */
export function PageContainer({
  width = 'full',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  width?: PageWidth;
  children: ReactNode;
}) {
  return (
    <div className={[WIDTH_CLASS[width], className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}
