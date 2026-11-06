import type { ButtonHTMLAttributes, Ref } from 'react';

import {
  dangerButtonClass,
  ghostButtonClass,
  iconButtonClass,
  primaryButtonClass,
  quietIconButtonClass,
  secondaryButtonClass,
  toolbarButtonClass,
} from './classes.ts';

export type ButtonVariant =
  'primary' | 'secondary' | 'ghost' | 'danger' | 'toolbar' | 'icon' | 'quiet';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: primaryButtonClass,
  secondary: secondaryButtonClass,
  ghost: ghostButtonClass,
  danger: dangerButtonClass,
  toolbar: toolbarButtonClass,
  icon: iconButtonClass,
  quiet: quietIconButtonClass,
};

export function Button({
  variant = 'secondary',
  fullWidth = false,
  className,
  type = 'button',
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={[VARIANT_CLASS[variant], fullWidth ? 'w-full' : '', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
