import { banMarkerForStatus, type BanDisplayStatus } from './formatBanContext.ts';

export function BanThumbMarker({
  status,
  className = '',
}: {
  status: BanDisplayStatus;
  className?: string;
}) {
  const { glyph, label, colorClass } = banMarkerForStatus(status);
  return (
    <span
      className={`pointer-events-none absolute left-0.5 top-0.5 z-[1] text-base font-bold leading-none drop-shadow-[0_0_2px_rgba(0,0,0,0.45)] ${colorClass} ${className}`.trim()}
      title={label}
      aria-hidden
    >
      <span className="sr-only">{label}</span>
      {glyph}
    </span>
  );
}
