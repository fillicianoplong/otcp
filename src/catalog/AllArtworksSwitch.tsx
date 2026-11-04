import { ALL_ARTWORKS_QUERY_KEY, persistAllArtworksPreference } from './allArtworksPreference.ts';

export function AllArtworksSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm text-text">
      <span className="font-medium text-heading">All artworks</span>
      <span className="relative inline-flex h-9 w-14 shrink-0 items-center rounded-md border border-border">
        <input
          type="checkbox"
          role="switch"
          className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
          checked={enabled}
          aria-checked={enabled}
          onChange={(event) => {
            const next = event.target.checked;
            persistAllArtworksPreference(next);
            onChange(next);
          }}
          aria-describedby={`${ALL_ARTWORKS_QUERY_KEY}-hint`}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[calc(var(--radius-md)-1px)] bg-heading/70 transition-colors peer-checked:bg-surface peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-border-strong"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1 h-4 w-4 -translate-y-1/2 rounded-full border border-border bg-text-2 transition-all peer-checked:left-[calc(100%-1.25rem)] peer-checked:border-border-strong peer-checked:bg-heading"
        />
      </span>
      <span id={`${ALL_ARTWORKS_QUERY_KEY}-hint`} className="sr-only">
        {enabled ? 'Showing every artwork as its own tile' : 'Showing one tile per matching card'}
      </span>
    </label>
  );
}
