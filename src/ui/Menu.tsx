import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';

import { menuItemClass, menuPanelClass } from './classes.ts';
import { placeAnchoredMenu, readMenuGap } from './menuPosition.ts';

export type MenuItem = {
  key: string;
  label: string;
  href?: string;
  disabled?: boolean;
  title?: string;
  checked?: boolean;
  separatorBefore?: boolean;
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

const MENU_ITEM_SELECTOR = [
  '[role="menuitem"]:not([disabled])',
  '[role="menuitemradio"]:not([disabled])',
  '[role="menuitemcheckbox"]:not([disabled])',
].join(', ');

function menuItems(menu: HTMLElement): HTMLElement[] {
  return [...menu.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)];
}

function focusMenuItem(menu: HTMLElement, delta: number) {
  const items = menuItems(menu);
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
  const [focusEdge, setFocusEdge] = useState<'first' | 'last' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = (edge: 'first' | 'last' | null) => {
    setFocusEdge(edge);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
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
    if (!open || !focusEdge) return;
    const menu = menuRef.current;
    if (!menu) return;
    const entries = menuItems(menu);
    const target = focusEdge === 'last' ? entries[entries.length - 1] : entries[0];
    target?.focus();
  }, [focusEdge, open]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;
      const gap = readMenuGap();
      menu.style.maxHeight = 'none';
      const anchor = placeAnchoredMenu(
        button.getBoundingClientRect(),
        { width: menu.offsetWidth, height: menu.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight },
        gap,
        align,
      );
      menu.style.position = 'fixed';
      menu.style.transition = 'none';
      menu.style.top = `${anchor.top}px`;
      menu.style.left = `${anchor.left}px`;
      menu.style.right = 'auto';
      menu.style.margin = '0';
      menu.style.maxHeight = `${anchor.maxHeight}px`;
      menu.style.overflowY = menu.scrollHeight > anchor.maxHeight ? 'auto' : 'visible';
    };
    place();
    const menu = menuRef.current;
    const observer =
      menu && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null;
    if (menu) observer?.observe(menu);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [align, children, items, open]);

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
        title={triggerAriaLabel}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          openMenu(focusFirstItem ? 'first' : null);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          const edge = event.key === 'ArrowUp' ? 'last' : 'first';
          if (!open) {
            openMenu(edge);
            return;
          }
          const menu = menuRef.current;
          if (!menu) return;
          const entries = menuItems(menu);
          (edge === 'last' ? entries[entries.length - 1] : entries[0])?.focus();
        }}
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
          onClick={(event) => {
            const item = (event.target as HTMLElement).closest<HTMLElement>(
              '[role="menuitem"], [role="menuitemradio"]',
            );
            if (!item || item.hasAttribute('data-menu-stay') || item.hasAttribute('disabled')) {
              return;
            }
            setOpen(false);
            buttonRef.current?.focus();
          }}
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
              menuItems(menu)[0]?.focus();
            } else if (event.key === 'End') {
              event.preventDefault();
              const entries = menuItems(menu);
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
              <span key={item.key} className="contents">
                {item.separatorBefore ? (
                  <div className="my-1 border-t border-border" role="separator" />
                ) : null}
                <button
                  type="button"
                  role={item.checked == null ? 'menuitem' : 'menuitemradio'}
                  aria-checked={item.checked}
                  className={menuItemClass}
                  disabled={item.disabled}
                  title={item.title}
                  onClick={() => {
                    if (item.disabled) return;
                    setOpen(false);
                    item.onSelect?.();
                  }}
                >
                  {item.checked == null ? null : (
                    <span aria-hidden="true" className="inline-flex w-4 shrink-0">
                      {item.checked ? (
                        <svg viewBox="0 0 12 12" className="size-3" fill="none">
                          <path
                            d="M2 6.5 4.5 9 10 3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </span>
                  )}
                  {item.label}
                </button>
              </span>
            ),
          )}
          {children}
        </div>
      ) : null}
    </div>
  );
}
