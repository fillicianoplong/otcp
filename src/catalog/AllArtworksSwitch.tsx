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
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => {
          const next = event.target.checked;
          persistAllArtworksPreference(next);
          onChange(next);
        }}
        className="size-4 shrink-0 rounded-sm border border-border bg-surface accent-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        aria-describedby={`${ALL_ARTWORKS_QUERY_KEY}-hint`}
      />
      <span className="font-medium text-heading">All artworks</span>
      <span id={`${ALL_ARTWORKS_QUERY_KEY}-hint`} className="sr-only">
        {enabled ? 'Showing every artwork as its own tile' : 'Showing one tile per matching card'}
      </span>
    </label>
  );
}
