import { AllArtworksSwitch } from './AllArtworksSwitch.tsx';

export function AllArtworksFilterGroup({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="bg-surface-2 px-3 py-2">
        <span className="text-sm font-medium text-heading">Artworks</span>
      </div>
      <div className="px-3 py-3">
        <AllArtworksSwitch enabled={enabled} onChange={onChange} />
      </div>
    </section>
  );
}
