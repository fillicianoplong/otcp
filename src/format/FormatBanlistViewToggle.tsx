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

const toggleButtonClass =
  'min-h-9 min-w-9 items-center justify-center border border-border bg-surface text-text-2 hover:border-border-strong hover:text-heading focus-visible:z-[1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

const selectedClass = 'relative z-[1] border-border-strong bg-surface-2 text-heading';

export type FormatBanlistViewMode = 'grid' | 'list';

export function FormatBanlistViewToggle({
  value,
  onChange,
}: {
  value: FormatBanlistViewMode;
  onChange: (mode: FormatBanlistViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Banlist view"
      className="inline-flex overflow-hidden rounded-md border border-border"
    >
      <button
        type="button"
        className={`${toggleButtonClass} inline-flex rounded-l-md ${value === 'grid' ? selectedClass : ''}`}
        aria-pressed={value === 'grid'}
        aria-label="Grid view"
        onClick={() => onChange('grid')}
      >
        <GridIcon />
      </button>
      <button
        type="button"
        className={`${toggleButtonClass} inline-flex -ml-px rounded-r-md ${value === 'list' ? selectedClass : ''}`}
        aria-pressed={value === 'list'}
        aria-label="List view"
        onClick={() => onChange('list')}
      >
        <ListIcon />
      </button>
    </div>
  );
}
