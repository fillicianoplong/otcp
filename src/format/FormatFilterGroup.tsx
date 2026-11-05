import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { FACET_OPTION_LIST_SCROLL_CAP_PX } from '../catalog/facetOptionListLayout.ts';
import { listFormatsNewestFirst, type FormatId } from './formatCatalog.ts';

type FormatFilterGroupProps = {
  value: FormatId | null;
  onChange: (formatId: FormatId | null) => void;
};

function formatTriggerLabel(
  value: FormatId | null,
  formats: ReadonlyArray<{ id: FormatId; name: string }>,
): string {
  if (!value) return 'None';
  return formats.find((format) => format.id === value)?.name ?? value;
}

export function FormatFilterGroup({ value, onChange }: FormatFilterGroupProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const formats = useMemo(() => listFormatsNewestFirst(), []);
  const triggerLabel = formatTriggerLabel(value, formats);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <section
      ref={rootRef}
      className="relative overflow-visible rounded-lg border border-border bg-surface"
    >
      <div className="bg-surface-2 px-3 py-2">
        <span id={`${listId}-label`} className="text-sm font-medium text-heading">
          Format
        </span>
      </div>
      <div className="px-3 py-3">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${listId}-label`}
          onClick={() => setOpen((current) => !current)}
          className="flex min-h-[var(--touch-min)] w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-left text-sm text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          <span className="min-w-0 truncate">{triggerLabel}</span>
          <span aria-hidden="true" className="shrink-0 text-text-2">
            {open ? '▴' : '▾'}
          </span>
        </button>
        {open ? (
          <ul
            role="listbox"
            aria-labelledby={`${listId}-label`}
            className="absolute left-3 right-3 z-20 mt-1 max-h-[min(16rem,var(--format-filter-max,16rem))] overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-lg"
            style={{ maxHeight: `${FACET_OPTION_LIST_SCROLL_CAP_PX}px` }}
          >
            <li role="none">
              <button
                type="button"
                role="option"
                aria-selected={value === null}
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className={`flex min-h-9 w-full items-center px-3 text-left text-sm hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong ${
                  value === null ? 'bg-surface-2 font-medium text-heading' : 'text-text'
                }`}
              >
                None
              </button>
            </li>
            {formats.map((format) => {
              const selected = value === format.id;
              return (
                <li key={format.id} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(format.id);
                      setOpen(false);
                    }}
                    className={`flex min-h-9 w-full items-center px-3 text-left text-sm hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong ${
                      selected ? 'bg-surface-2 font-medium text-heading' : 'text-text'
                    }`}
                  >
                    {format.name}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
