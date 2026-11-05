import { ALL_ARTWORKS_QUERY_KEY } from './allArtworksPreference.ts';
import { catalogViewToggleSelectedClass } from './CatalogViewToggle.tsx';

const toggleShellClass =
  'inline-flex min-h-9 w-full items-center rounded-md border border-border bg-surface focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-border-strong';

const toggleButtonClass =
  'min-h-9 rounded-md px-3 text-sm font-medium text-text-2 transition-colors hover:text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

export function AllArtworksSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Artwork display"
      className={toggleShellClass}
      aria-describedby={`${ALL_ARTWORKS_QUERY_KEY}-hint`}
    >
      <button
        type="button"
        className={`${toggleButtonClass} min-w-0 flex-1 rounded-l-md ${!enabled ? catalogViewToggleSelectedClass : ''}`}
        aria-pressed={!enabled}
        onClick={() => onChange(false)}
      >
        One per card
      </button>
      <button
        type="button"
        className={`${toggleButtonClass} min-w-0 flex-1 -ml-px rounded-r-md ${enabled ? catalogViewToggleSelectedClass : ''}`}
        aria-pressed={enabled}
        onClick={() => onChange(true)}
      >
        All artworks
      </button>
      <span id={`${ALL_ARTWORKS_QUERY_KEY}-hint`} className="sr-only">
        {enabled
          ? 'Showing every artwork as its own tile when the catalog has alternate art ids'
          : 'Showing one tile per matching card'}
      </span>
    </div>
  );
}
