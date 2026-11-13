import { Chip } from '../ui/Chip.tsx';
import { clearChipClass } from '../ui/classes.ts';
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
    <>
      <ul className="contents" aria-label="Active filters">
        {chips.map((chip) => (
          <li key={chip.id}>
            <Chip
              label={chip.label}
              removeLabel={`Remove ${chip.label}`}
              onClick={() =>
                onChange((state) =>
                  removeFilterChip(state, {
                    fieldId: chip.fieldId,
                    kind: chip.kind,
                    value: chip.value,
                  }),
                )
              }
            />
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onChange(clearAllFilters())} className={clearChipClass}>
        Clear all
      </button>
    </>
  );
}
