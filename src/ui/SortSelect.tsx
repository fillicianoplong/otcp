import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { focusRingClass, focusRingInsetClass } from './classes.ts';
import { placeAnchoredMenu, readMenuGap } from './menuPosition.ts';

const sortMenuItemClass = `flex w-full items-center gap-2 whitespace-nowrap px-control-x py-1.5 text-left text-sm text-heading hover:bg-surface-2 ${focusRingInsetClass} disabled:cursor-not-allowed disabled:opacity-50`;

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

/** Same stroke as the column-header and toolbar icons. */
function DirectionIcon({ direction }: { direction: 'asc' | 'desc' }) {
  const ascending = direction === 'asc';
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path
        d={ascending ? 'M8 13V3.5M4.5 7 8 3.5 11.5 7' : 'M8 3v9.5M4.5 9 8 12.5 11.5 9'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function directionMark(direction: 'asc' | 'desc'): string {
  return direction === 'asc' ? '↑' : '↓';
}

function CheckMark() {
  return (
    <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden="true">
      <path
        d="M2 6.5 4.5 9 10 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Same stroke as the section chevron and the other toolbar icons. */
function ChevronDownIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-text-2" fill="none">
      <path
        d="M4 6.5 8 10.5 12 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuWidthRow({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      data-sort-sizer=""
      className="invisible col-start-1 row-start-1 flex items-center gap-2 whitespace-nowrap"
    >
      {label}
      <span className="inline-block size-4 shrink-0" />
    </span>
  );
}

function TriggerWidthRow({ label, withDirection }: { label: string; withDirection: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-sort-sizer=""
      className="invisible col-start-1 row-start-1 flex items-center gap-1 whitespace-nowrap"
    >
      <span className="flex items-center gap-1">
        {label}
        {withDirection ? <span className="inline-block h-4 w-4 shrink-0" /> : null}
      </span>
      <span className="inline-block h-4 w-4 shrink-0" />
    </span>
  );
}

/**
 * One dropdown for the field and, when a direction is set, Ascending or Descending.
 * The closed control is as wide as the longest option, so the width stays put.
 */
export function SortSelect<T extends string>({
  id,
  value,
  options,
  onChange,
  direction,
  onDirectionChange,
}: {
  id?: string;
  value: T;
  options: readonly SortSelectOption<T>[];
  onChange: (value: T) => void;
  direction?: 'asc' | 'desc';
  onDirectionChange?: (direction: 'asc' | 'desc') => void;
}) {
  const menuId = useId().replace(/:/g, '');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fieldLabel = options.find((option) => option.value === value)?.label ?? String(value);
  const showDirection = direction != null && onDirectionChange != null;
  const closedLabel = showDirection ? `${fieldLabel} ${directionMark(direction)}` : fieldLabel;
  const menuLabels = [
    ...options.map((option) => option.label),
    ...(showDirection ? ['Ascending', 'Descending'] : []),
  ];

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
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[data-sort-field][aria-checked="true"]')?.focus();
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;
      const gap = readMenuGap();
      const width = button.offsetWidth;
      menu.style.position = 'fixed';
      menu.style.boxSizing = 'border-box';
      menu.style.width = `${width}px`;
      menu.style.minWidth = `${width}px`;
      menu.style.maxWidth = `${width}px`;
      menu.style.maxHeight = 'none';
      const anchor = placeAnchoredMenu(
        button.getBoundingClientRect(),
        { width, height: menu.scrollHeight },
        { width: window.innerWidth, height: window.innerHeight },
        gap,
        'start',
      );
      menu.style.transition = 'none';
      menu.style.top = `${anchor.top}px`;
      menu.style.left = `${anchor.left}px`;
      menu.style.right = 'auto';
      menu.style.margin = '0';
      menu.style.maxHeight = `${anchor.maxHeight}px`;
      menu.style.overflowY = menu.scrollHeight > anchor.maxHeight ? 'auto' : 'hidden';
      menu.style.overflowX = 'hidden';
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, options, value, direction]);

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-label={closedLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={`inline-grid h-control items-center rounded-md border border-border bg-surface px-control-x text-left text-sm text-heading hover:border-border-strong ${focusRingClass}`}
      >
        {menuLabels.map((label) => (
          <MenuWidthRow key={label} label={label} />
        ))}
        {options.map((option) => (
          <TriggerWidthRow
            key={`trigger-${option.label}`}
            label={option.label}
            withDirection={showDirection}
          />
        ))}
        <span className="col-start-1 row-start-1 flex w-full items-center justify-between gap-1">
          <span className="flex items-center gap-1">
            <span>{fieldLabel}</span>
            {showDirection ? <DirectionIcon direction={direction} /> : null}
          </span>
          <ChevronDownIcon />
        </span>
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={closedLabel}
          className="absolute z-20 flex min-w-0 flex-col rounded-md border border-border bg-surface py-1 shadow-sm"
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
                data-sort-field=""
                aria-checked={checked}
                className={sortMenuItemClass}
                onClick={() => {
                  setOpen(false);
                  onChange(option.value);
                }}
              >
                <span className="min-w-0 flex-1 text-left">{option.label}</span>
                <span
                  aria-hidden="true"
                  className="inline-flex size-4 shrink-0 items-center justify-end"
                >
                  {checked ? <CheckMark /> : null}
                </span>
              </button>
            );
          })}
          {showDirection ? (
            <>
              <div role="separator" className="my-1 h-px bg-border" />
              {(['asc', 'desc'] as const).map((next) => {
                const checked = direction === next;
                const label = next === 'asc' ? 'Ascending' : 'Descending';
                return (
                  <button
                    key={next}
                    type="button"
                    role="menuitemradio"
                    data-sort-direction=""
                    aria-checked={checked}
                    className={sortMenuItemClass}
                    onClick={() => {
                      setOpen(false);
                      onDirectionChange(next);
                    }}
                  >
                    <span className="min-w-0 flex-1 text-left">{label}</span>
                    <span
                      aria-hidden="true"
                      className="inline-flex size-4 shrink-0 items-center justify-end"
                    >
                      {checked ? <CheckMark /> : null}
                    </span>
                  </button>
                );
              })}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
