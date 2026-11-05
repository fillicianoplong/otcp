import { useMemo } from 'react';

import { listFormatsNewestFirst, type FormatId } from './formatCatalog.ts';

type FormatFilterGroupProps = {
  value: FormatId | null;
  onChange: (formatId: FormatId | null) => void;
};

export function FormatFilterGroup({ value, onChange }: FormatFilterGroupProps) {
  const formats = useMemo(() => listFormatsNewestFirst(), []);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="bg-surface-2 px-3 py-2">
        <label htmlFor="format-filter-select" className="text-sm font-medium text-heading">
          Format
        </label>
      </div>
      <div className="px-3 py-3">
        <select
          id="format-filter-select"
          value={value ?? ''}
          onChange={(event) => {
            const next = event.target.value;
            onChange(next ? (next as FormatId) : null);
          }}
          className="min-h-[var(--touch-min)] w-full rounded-md border border-border bg-surface px-3 text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          <option value="">None</option>
          {formats.map((format) => (
            <option key={format.id} value={format.id}>
              {format.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
