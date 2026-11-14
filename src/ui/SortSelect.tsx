import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { focusRingInsetClass } from './classes.ts';
import { placeAnchoredMenu, readMenuGap } from './menuPosition.ts';

const sortMenuPanelClass =
  'absolute right-0 z-20 flex w-max min-w-max flex-col rounded-md border border-border bg-surface py-1 shadow-sm';

const sortMenuItemClass = `flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left text-sm text-heading hover:bg-surface-2 ${focusRingInsetClass}`;

export type SortSelectOption<T extends string> = {
  value: T;
  label: string;
};

const MENU_ITEM_SELECTOR = '[role="menuitemradio"]:not([disabled])';

function focusMenuItem(menu: HTMLElement, delta: number) {
  const items = [...menu.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)];
  if (items.length === 0) return;
  const current = items.indexOf(document.activeElement as HTMLElement);
  const next = current === -1 ? 0 : (current + delta + items.length) % items.length;
  items[next]?.focus();
}

function DirectionArrow({ direction }: { direction: 'asc' | 'desc' }) {
  const ascending = direction === 'asc';
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none">
      <path
        d={ascending ? 'M8 12.5V3.5M4.5 7 8 3.5 11.5 7' : 'M8 3.5v9M4.5 9 8 12.5 11.5 9'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Narrow field menu with a direction arrow. The closed label is the field name. */
export function SortSelect<T extends string>({
  id,
  value,
  options,
  onChange,
  direction,
  onDirectionChange,
}: {
  id?: string;
  label?: string;
  value: T;
  options: readonly SortSelectOption<T>[];
  onChange: (value: T) => void;
  direction?: 'asc' | 'desc';
  onDirectionChange?: (direction: 'asc' | 'desc') => void;
}) {
  const menuId = useId().replace(/:/g, '');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fieldLabel = options.find((option) => option.value === value)?.label ?? String(value);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const root = rootRef.current;
      const menu = menuRef.current;
      if (!root || !menu) return;
      const gap = readMenuGap();
      menu.style.maxHeight = 'none';
      const anchor = placeAnchoredMenu(
        root.getBoundingClientRect(),
        { width: menu.offsetWidth, height: menu.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight },
        gap,
        'end',
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
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, options, value]);

  return (
    <div
      ref={rootRef}
      className="inline-flex h-control shrink-0 items-center rounded-md border border-border bg-surface text-sm text-heading focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-border-strong"
    >
      <button
        id={id}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="h-full max-w-[7.5rem] truncate bg-transparent px-2 text-left text-sm text-heading"
      >
        {fieldLabel}
      </button>
      {direction != null && onDirectionChange ? (
        <button
          type="button"
          aria-label={direction === 'asc' ? 'Ascending' : 'Descending'}
          onClick={() => onDirectionChange(direction === 'asc' ? 'desc' : 'asc')}
          className="inline-flex h-full w-7 shrink-0 items-center justify-center border-l border-border text-text-2 hover:text-heading"
        >
          <DirectionArrow direction={direction} />
        </button>
      ) : null}
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={fieldLabel}
          className={sortMenuPanelClass}
          onKeyDown={(event) => {
            const menu = menuRef.current;
            if (!menu) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              focusMenuItem(menu, 1);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              focusMenuItem(menu, -1);
            }
          }}
        >
          {options.map((option) => {
            const checked = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                className={sortMenuItemClass}
                onClick={() => {
                  setOpen(false);
                  onChange(option.value);
                }}
              >
                <span aria-hidden="true" className="inline-flex w-4 shrink-0">
                  {checked ? (
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
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
