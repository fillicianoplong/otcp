import {
  resultToolbarGroupClass,
  resultToolbarToggleButtonClass,
} from '../catalog/resultToolbar.ts';
import type { CardFinderViewMode } from './cardFinderView.ts';

function GridIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
      <rect x="1" y="1" width="6" height="6" rx="0.5" />
      <rect x="9" y="1" width="6" height="6" rx="0.5" />
      <rect x="1" y="9" width="6" height="6" rx="0.5" />
      <rect x="9" y="9" width="6" height="6" rx="0.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
      <rect x="1" y="2" width="14" height="2" rx="0.5" />
      <rect x="1" y="7" width="14" height="2" rx="0.5" />
      <rect x="1" y="12" width="14" height="2" rx="0.5" />
    </svg>
  );
}

const selectedClass = 'relative z-[1] border-border-strong bg-surface-2 text-heading';

export function CardFinderViewToggle({
  value,
  onChange,
  groupLabel = 'Library view',
  listLabel = 'List view',
  gridLabel = 'Grid view',
}: {
  value: CardFinderViewMode;
  onChange: (mode: CardFinderViewMode) => void;
  groupLabel?: string;
  listLabel?: string;
  gridLabel?: string;
}) {
  return (
    <div role="group" aria-label={groupLabel} className={resultToolbarGroupClass}>
      <button
        type="button"
        className={`${resultToolbarToggleButtonClass} inline-flex rounded-l-md ${value === 'list' ? selectedClass : ''}`}
        aria-pressed={value === 'list'}
        aria-label={listLabel}
        onClick={() => onChange('list')}
      >
        <ListIcon />
      </button>
      <button
        type="button"
        className={`${resultToolbarToggleButtonClass} inline-flex -ml-px rounded-r-md ${value === 'grid' ? selectedClass : ''}`}
        aria-pressed={value === 'grid'}
        aria-label={gridLabel}
        onClick={() => onChange('grid')}
      >
        <GridIcon />
      </button>
    </div>
  );
}
