import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import type { GameDefinition, GameId } from '../games/types.ts';
import { Combobox, type ComboboxOption } from '../ui/Combobox.tsx';

type GameFilterGroupProps = {
  games: readonly GameDefinition[];
  value: GameId;
  onChange: (gameId: GameId) => void;
  /** When set, the built-in label is omitted and this id names the combobox. */
  labelledBy?: string;
};

function gameMatchesQuery(game: GameDefinition, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return game.name.toLowerCase().includes(normalized) || game.id.toLowerCase().includes(normalized);
}

function isPrintableKey(event: KeyboardEvent<HTMLElement>): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

/** Same closed select as Format. Yu-Gi-Oh! is selected when it is the only game. */
export function GameFilterGroup({ games, value, onChange, labelledBy }: GameFilterGroupProps) {
  const rawId = useId().replace(/:/g, '');
  const inputId = `${rawId}-game`;
  const listId = `${rawId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const options = useMemo(() => [...games], [games]);
  const filtered = useMemo(
    () => options.filter((game) => gameMatchesQuery(game, open ? query : '')),
    [open, options, query],
  );
  const selected = options.find((game) => game.id === value) ?? options[0];
  const selectedIndex = selected ? options.findIndex((game) => game.id === selected.id) : -1;
  const triggerLabel = selected?.name ?? '';
  const activeIndexClamped =
    filtered.length === 0 ? -1 : Math.min(Math.max(activeIndex, 0), filtered.length - 1);
  const activeOption = activeIndexClamped >= 0 ? filtered[activeIndexClamped] : undefined;
  const activeOptionId = activeOption ? `${rawId}-opt-${activeOption.id}` : undefined;

  const closeList = () => {
    setOpen(false);
    setQuery('');
  };

  const openList = (nextActive: number) => {
    setOpen(true);
    setQuery('');
    setActiveIndex(nextActive);
  };

  const selectOption = (game: GameDefinition) => {
    onChange(game.id);
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
        openList(Math.min(start + 1, Math.max(options.length - 1, 0)));
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

    if (!open && isPrintableKey(event)) {
      event.preventDefault();
      setOpen(true);
      setQuery(event.key);
      setActiveIndex(0);
    }
  };

  const comboboxOptions: ComboboxOption[] = filtered.map((game) => ({
    id: game.id,
    label: game.name,
  }));

  return (
    <Combobox
      label="Game"
      labelledBy={labelledBy}
      inputId={inputId}
      listId={listId}
      open={open}
      query={query}
      valueLabel={triggerLabel}
      placeholder={open ? 'Search games' : 'Game'}
      options={comboboxOptions}
      activeIndex={activeIndexClamped}
      selectedId={selected?.id ?? null}
      emptyMessage="No games match."
      optionDomId={(id) => `${rawId}-opt-${id}`}
      inputRef={inputRef}
      rootRef={rootRef}
      caretHidden
      disclosureLabel={{ open: 'Hide games', closed: 'Show games' }}
      onQueryChange={(next) => {
        setQuery(next);
        setActiveIndex(0);
      }}
      onOpen={() => openList(selectedIndex >= 0 ? selectedIndex : 0)}
      onClose={closeList}
      onActiveIndex={setActiveIndex}
      onSelect={(id) => {
        const game = options.find((entry) => entry.id === id);
        if (game) selectOption(game);
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
