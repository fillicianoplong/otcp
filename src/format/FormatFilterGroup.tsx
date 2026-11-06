import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { Combobox, type ComboboxOption } from '../ui/Combobox.tsx';
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

const ALL_FORMATS_OPTION_ID = 'all';

function optionKey(id: FormatId | null): string {
  return id ?? ALL_FORMATS_OPTION_ID;
}

function filterFormatOptions(options: readonly FormatOption[], query: string): FormatOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...options];
  return options.filter((option) => formatOptionMatchesQuery(option, normalized));
}

function isPrintableKey(event: KeyboardEvent<HTMLElement>): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
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

  const comboboxOptions: ComboboxOption[] = filtered.map((option) => ({
    id: optionKey(option.id),
    label: option.name,
  }));

  return (
    <Combobox
      label="Format"
      labelledBy={labelledBy}
      inputId={inputId}
      listId={listId}
      open={open}
      query={query}
      valueLabel={triggerLabel}
      placeholder={open ? 'Search formats' : allowEmpty ? ALL_FORMATS_LABEL : 'Format'}
      options={comboboxOptions}
      activeIndex={activeIndexClamped}
      selectedId={value == null ? (allowEmpty ? ALL_FORMATS_OPTION_ID : null) : value}
      emptyMessage="No formats match."
      optionDomId={(id) => `${rawId}-opt-${id}`}
      inputRef={inputRef}
      rootRef={rootRef}
      caretHidden
      disclosureLabel={{ open: 'Hide formats', closed: 'Show formats' }}
      onQueryChange={(next) => {
        setQuery(next);
        setActiveIndex(0);
      }}
      onOpen={() => openList(selectedIndex >= 0 ? selectedIndex : 0)}
      onClose={closeList}
      onActiveIndex={setActiveIndex}
      onSelect={(id) => {
        const option = options.find((entry) => optionKey(entry.id) === id);
        if (option) selectOption(option);
      }}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && rootRef.current?.contains(next)) return;
        if (open) closeList();
      }}
    />
  );
}
