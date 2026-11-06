import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';

import { menuItemClass, menuPanelClass } from './classes.ts';

export type MenuItem = {
  key: string;
  label: string;
  href?: string;
  disabled?: boolean;
  title?: string;
  onSelect?: () => void;
};

type MenuProps = {
  /** Accessible name of the menu panel. */
  label: string;
  trigger: ReactNode;
  triggerClassName: string;
  triggerAriaLabel?: string;
  align?: 'end' | 'start';
  focusFirstItem?: boolean;
  rootClassName?: string;
  items?: readonly MenuItem[];
  children?: ReactNode;
};

function focusMenuItem(menu: HTMLElement, delta: number) {
  const items = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')];
  if (items.length === 0) return;
  const current = items.indexOf(document.activeElement as HTMLElement);
  const next = current === -1 ? 0 : (current + delta + items.length) % items.length;
  items[next]?.focus();
}

export function Menu({
  label,
  trigger,
  triggerClassName,
  triggerAriaLabel,
  align = 'end',
  focusFirstItem = false,
  rootClassName,
  items,
  children,
}: MenuProps) {
  const menuId = useId().replace(/:/g, '');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !focusFirstItem) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
  }, [focusFirstItem, open]);

  const alignClass = align === 'end' ? 'right-0' : 'left-0';

  return (
    <div ref={rootRef} className={['relative shrink-0', rootClassName].filter(Boolean).join(' ')}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        aria-label={triggerAriaLabel}
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          className={`${menuPanelClass} ${alignClass}`}
          onKeyDown={(event) => {
            const menu = menuRef.current;
            if (!menu) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              focusMenuItem(menu, 1);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              focusMenuItem(menu, -1);
            } else if (event.key === 'Home') {
              event.preventDefault();
              menu.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
            } else if (event.key === 'End') {
              event.preventDefault();
              const entries = menu.querySelectorAll<HTMLElement>(
                '[role="menuitem"]:not([disabled])',
              );
              entries[entries.length - 1]?.focus();
            } else if (event.key === 'Tab') {
              setOpen(false);
            }
          }}
        >
          {items?.map((item) =>
            item.href && !item.disabled ? (
              <Link
                key={item.key}
                role="menuitem"
                to={item.href}
                className={menuItemClass}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={menuItemClass}
                disabled={item.disabled}
                title={item.title}
                onClick={() => {
                  if (item.disabled) return;
                  setOpen(false);
                  item.onSelect?.();
                }}
              >
                {item.label}
              </button>
            ),
          )}
          {children}
        </div>
      ) : null}
    </div>
  );
}
