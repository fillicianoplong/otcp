import type { CatalogViewMode } from './catalogViewMode.ts';

function GridIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 fill-current">
      <rect x="1" y="1" width="6" height="6" rx="0.5" />
      <rect x="9" y="1" width="6" height="6" rx="0.5" />
      <rect x="1" y="9" width="6" height="6" rx="0.5" />
      <rect x="9" y="9" width="6" height="6" rx="0.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 fill-current">
      <rect x="1" y="2" width="14" height="2" rx="0.5" />
      <rect x="1" y="7" width="14" height="2" rx="0.5" />
      <rect x="1" y="12" width="14" height="2" rx="0.5" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 fill-current">
      <rect x="1" y="1" width="14" height="14" rx="0.5" fill="none" stroke="currentColor" />
      <path d="M1 5.5h14M1 10h14M6 1v14" stroke="currentColor" fill="none" />
    </svg>
  );
}

const toggleButtonClass =
  'inline-flex min-h-9 min-w-9 items-center justify-center border border-border bg-surface text-text-2 first:rounded-l-md last:rounded-r-md hover:border-border-strong hover:text-heading focus-visible:z-[1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:cursor-not-allowed disabled:opacity-50';

export function CatalogViewToggle({
  value,
  onChange,
}: {
  value: CatalogViewMode;
  onChange: (mode: CatalogViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Result view"
      className="inline-flex overflow-hidden rounded-md shadow-sm"
    >
      <button
        type="button"
        className={`${toggleButtonClass} ${value === 'grid' ? 'border-border-strong bg-surface-2 text-heading' : ''}`}
        aria-pressed={value === 'grid'}
        aria-label="Grid view"
        onClick={() => onChange('grid')}
      >
        <GridIcon />
      </button>
      <button
        type="button"
        className={`${toggleButtonClass} -ml-px ${value === 'list' ? 'border-border-strong bg-surface-2 text-heading' : ''}`}
        aria-pressed={value === 'list'}
        aria-label="List view"
        onClick={() => onChange('list')}
      >
        <ListIcon />
      </button>
      <button
        type="button"
        className={`${toggleButtonClass} -ml-px hidden sm:inline-flex ${value === 'table' ? 'border-border-strong bg-surface-2 text-heading' : ''}`}
        aria-pressed={value === 'table'}
        aria-label="Table view"
        title="Coming soon"
        disabled
      >
        <TableIcon />
      </button>
    </div>
  );
}
