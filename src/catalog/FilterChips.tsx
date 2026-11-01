import type { FilterChip } from './filterUrlState.ts';
import { removeFilterChip, clearAllFilters } from './filterSelection.ts';
import type { FilterStateUpdater } from './filterEngine.ts';

type FilterChipsProps = {
  chips: readonly FilterChip[];
  onChange: (next: FilterStateUpdater) => void;
};

export function FilterChips({ chips, onChange }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul className="flex max-w-full flex-wrap gap-2" aria-label="Active filters">
        {chips.map((chip) => (
          <li key={chip.id}>
            <button
              type="button"
              onClick={() =>
                onChange((state) =>
                  removeFilterChip(state, {
                    fieldId: chip.fieldId,
                    kind: chip.kind,
                    value: chip.value,
                  }),
                )
              }
              className="inline-flex min-h-8 max-w-full items-center gap-1 rounded-full border border-border bg-surface-2 px-3 text-sm text-text hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
            >
              <span className="truncate">{chip.label}</span>
              <span aria-hidden="true" className="text-text-2">
                ×
              </span>
              <span className="sr-only">Remove {chip.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange(clearAllFilters())}
        className="shrink-0 text-sm text-text underline decoration-border underline-offset-2 hover:text-heading hover:decoration-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
      >
        Clear all
      </button>
    </div>
  );
}
