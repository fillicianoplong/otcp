import type { FocusEvent, KeyboardEvent, ReactNode, RefObject } from 'react';

import { comboboxFieldClass, comboboxInputClass, comboboxListClass } from './classes.ts';

export type ComboboxOption = {
  id: string;
  label: string;
};

function optionClassName(selected: boolean, active: boolean): string {
  const base =
    'flex min-h-control w-full min-w-0 cursor-pointer items-center px-3 text-left text-sm font-normal';
  if (active) {
    return `${base} bg-surface-2 text-heading ring-1 ring-inset ring-border-strong`;
  }
  if (selected) return `${base} bg-surface-2 text-heading`;
  return `${base} text-text hover:bg-surface-2`;
}

type ComboboxProps = {
  label: string;
  labelledBy?: string;
  inputId: string;
  listId: string;
  open: boolean;
  query: string;
  valueLabel: string;
  placeholder: string;
  options: readonly ComboboxOption[];
  activeIndex: number;
  selectedId: string | null;
  emptyMessage: string;
  optionDomId: (id: string) => string;
  inputRef?: RefObject<HTMLInputElement | null>;
  rootRef?: RefObject<HTMLDivElement | null>;
  caretHidden?: boolean;
  onQueryChange: (value: string) => void;
  onOpen: () => void;
  onClose: () => void;
  onActiveIndex: (index: number) => void;
  onSelect: (id: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLDivElement>) => void;
  disclosureLabel: { open: string; closed: string };
};

/** Searchable list field. Callers own the option set and keyboard rules. */
export function Combobox({
  label,
  labelledBy,
  inputId,
  listId,
  open,
  query,
  valueLabel,
  placeholder,
  options,
  activeIndex,
  selectedId,
  emptyMessage,
  optionDomId,
  inputRef,
  rootRef,
  caretHidden = false,
  onQueryChange,
  onOpen,
  onClose,
  onActiveIndex,
  onSelect,
  onKeyDown,
  onBlur,
  disclosureLabel,
}: ComboboxProps) {
  const labelId = labelledBy ?? `${inputId}-label`;
  const active = options[activeIndex];
  const activeOptionId = active ? optionDomId(active.id) : undefined;

  return (
    <div
      ref={rootRef}
      className="relative min-w-0 w-full max-w-full"
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      {labelledBy ? null : (
        <label id={labelId} htmlFor={inputId} className="sr-only">
          {label}
        </label>
      )}
      <div className={comboboxFieldClass}>
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
          value={open ? query : valueLabel}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => onQueryChange(event.target.value)}
          onPointerDown={() => {
            if (!open) onOpen();
          }}
          className={`${comboboxInputClass} ${open || !caretHidden ? '' : 'cursor-default caret-transparent'}`}
        />
        <button
          type="button"
          aria-label={open ? disclosureLabel.open : disclosureLabel.closed}
          aria-expanded={open}
          aria-controls={listId}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) {
              onClose();
              inputRef?.current?.focus();
              return;
            }
            onOpen();
            inputRef?.current?.focus();
          }}
          className="inline-flex size-control shrink-0 items-center justify-center text-text-2 hover:text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          <span aria-hidden="true">{open ? '▴' : '▾'}</span>
        </button>
      </div>
      {open ? (
        <ul id={listId} role="listbox" aria-labelledby={labelId} className={comboboxListClass}>
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm font-normal text-text-2">{emptyMessage}</li>
          ) : (
            options.map((option, index) => {
              const selected = option.id === selectedId;
              const isActive = index === activeIndex;
              return (
                <li key={option.id} role="none">
                  <div
                    id={optionDomId(option.id)}
                    role="option"
                    aria-selected={selected}
                    onPointerEnter={() => onActiveIndex(index)}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      onSelect(option.id);
                    }}
                    className={optionClassName(selected, isActive)}
                  >
                    <span className="min-w-0 truncate font-normal">{option.label}</span>
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

export function ComboboxHint({ children }: { children: ReactNode }) {
  return <p className="text-sm text-text-2">{children}</p>;
}
