import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { listFormatsNewestFirst, type FormatId } from './formatCatalog.ts';
import { formatOptionMatchesQuery } from './formatFilterSearch.ts';

const ALL_FORMATS_LABEL = 'All formats';

type FormatFilterGroupProps = {
  value: FormatId | null;
  onChange: (formatId: FormatId | null) => void;
  /**
   * Search includes an empty option. A deck does not: Backspace will not clear,
   * and the list has no "All formats" row.
   */
  allowEmpty?: boolean;
  /** When set, the built-in label is omitted and this id names the combobox. */
  labelledBy?: string;
};

type FormatOption = {
  id: FormatId | null;
  name: string;
};

function filterFormatOptions(options: readonly FormatOption[], query: string): FormatOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...options];
  return options.filter((option) => formatOptionMatchesQuery(option, normalized));
}

function isPrintableKey(event: KeyboardEvent<HTMLElement>): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

function optionClassName(selected: boolean, active: boolean): string {
  const base =
    'flex min-h-8 w-full min-w-0 cursor-pointer items-center px-3 text-left text-sm font-normal';
  if (active) {
    return `${base} bg-surface-2 text-heading ring-1 ring-inset ring-border-strong`;
  }
  if (selected) return `${base} bg-surface-2 text-heading`;
  return `${base} text-text hover:bg-surface-2`;
}

export function FormatFilterGroup({
  value,
  onChange,
  allowEmpty = true,
  labelledBy,
}: FormatFilterGroupProps) {
  const rawId = useId().replace(/:/g, '');
  const inputId = `${rawId}-format`;
  const listId = `${rawId}-list`;
  const labelId = labelledBy ?? `${rawId}-label`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const formats = useMemo(() => listFormatsNewestFirst(), []);
  const options = useMemo<FormatOption[]>(() => {
    const named = formats.map((format) => ({ id: format.id, name: format.name }));
    return allowEmpty ? [{ id: null, name: ALL_FORMATS_LABEL }, ...named] : named;
  }, [allowEmpty, formats]);
  const filtered = useMemo(
    () => filterFormatOptions(options, open ? query : ''),
    [open, options, query],
  );
  const selectedIndex = options.findIndex((option) => option.id === value);
  const triggerLabel =
    value == null
      ? allowEmpty
        ? ALL_FORMATS_LABEL
        : ''
      : (formats.find((format) => format.id === value)?.name ?? value);
  const activeIndexClamped =
    filtered.length === 0 ? -1 : Math.min(Math.max(activeIndex, 0), filtered.length - 1);
  const activeOption = activeIndexClamped >= 0 ? filtered[activeIndexClamped] : undefined;
  const activeOptionId = activeOption ? `${rawId}-opt-${activeOption.id ?? 'all'}` : undefined;

  const closeList = () => {
    setOpen(false);
    setQuery('');
  };

  const openList = (nextActive: number) => {
    setOpen(true);
    setQuery('');
    setActiveIndex(nextActive);
  };

  const selectOption = (option: FormatOption) => {
    onChange(option.id);
    closeList();
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeList();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || !activeOptionId) return;
    const node = document.getElementById(activeOptionId);
    if (!node || typeof node.scrollIntoView !== 'function') return;
    node.scrollIntoView({ block: 'nearest' });
  }, [activeOptionId, open]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      if (!open) return;
      event.preventDefault();
      event.stopPropagation();
      closeList();
      inputRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        const start = selectedIndex >= 0 ? selectedIndex : 0;
        openList(Math.min(start + 1, options.length - 1));
        return;
      }
      setActiveIndex((current) => {
        if (filtered.length === 0) return -1;
        const base = current < 0 ? -1 : Math.min(current, filtered.length - 1);
        return Math.min(base + 1, filtered.length - 1);
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        const start = selectedIndex >= 0 ? selectedIndex : 0;
        openList(Math.max(start - 1, 0));
        return;
      }
      setActiveIndex((current) => {
        if (filtered.length === 0) return -1;
        const base = current < 0 ? 0 : Math.min(current, filtered.length - 1);
        return Math.max(base - 1, 0);
      });
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      if (!open) openList(0);
      else setActiveIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      if (!open) openList(Math.max(options.length - 1, 0));
      else setActiveIndex(Math.max(filtered.length - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (!open) {
        openList(selectedIndex >= 0 ? selectedIndex : 0);
        return;
      }
      if (activeOption) selectOption(activeOption);
      return;
    }

    if (event.key === 'Backspace' && !open && value) {
      event.preventDefault();
      if (allowEmpty) onChange(null);
      return;
    }

    if (!open && isPrintableKey(event)) {
      event.preventDefault();
      setOpen(true);
      setQuery(event.key);
      setActiveIndex(0);
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative min-w-0 w-full max-w-full"
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && rootRef.current?.contains(next)) return;
        if (open) closeList();
      }}
    >
      {labelledBy ? null : (
        <label id={labelId} htmlFor={inputId} className="sr-only">
          Format
        </label>
      )}
      <div className="flex min-h-[var(--touch-min)] min-w-0 max-w-full items-center rounded-md border border-border bg-surface hover:border-border-strong focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-border-strong">
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? activeOptionId : undefined}
          aria-labelledby={labelId}
          type="text"
          value={open ? query : triggerLabel}
          placeholder={open ? 'Search formats' : allowEmpty ? ALL_FORMATS_LABEL : 'Format'}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onPointerDown={() => {
            if (!open) openList(selectedIndex >= 0 ? selectedIndex : 0);
          }}
          className={`min-w-0 flex-1 bg-transparent px-3 text-sm font-normal text-heading outline-none placeholder:font-normal placeholder:text-text-2 ${
            open ? '' : 'cursor-default caret-transparent'
          }`}
        />
        <button
          type="button"
          aria-label={open ? 'Hide formats' : 'Show formats'}
          aria-expanded={open}
          aria-controls={listId}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) {
              closeList();
              inputRef.current?.focus();
              return;
            }
            openList(selectedIndex >= 0 ? selectedIndex : 0);
            inputRef.current?.focus();
          }}
          className="inline-flex size-8 shrink-0 items-center justify-center text-text-2 hover:text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          <span aria-hidden="true">{open ? '▴' : '▾'}</span>
        </button>
      </div>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute top-full right-0 left-0 z-20 mt-1 max-h-60 w-full max-w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm font-normal text-text-2">No formats match.</li>
          ) : (
            filtered.map((option, index) => {
              const selected = option.id === value;
              const active = index === activeIndexClamped;
              const optionId = `${rawId}-opt-${option.id ?? 'all'}`;
              return (
                <li key={option.id ?? 'all'} role="none">
                  <div
                    id={optionId}
                    role="option"
                    aria-selected={selected}
                    onPointerEnter={() => setActiveIndex(index)}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      selectOption(option);
                    }}
                    className={optionClassName(selected, active)}
                  >
                    <span className="min-w-0 truncate font-normal">{option.name}</span>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
