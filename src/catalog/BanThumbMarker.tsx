import { banMarkerForStatus, type BanDisplayStatus } from './formatBanContext.ts';
import { resolveYgoBanStatusIconPath } from './cardIcons.ts';

/** ~1.5× row tier (16px), scaling with tile width (FR-60 / UI List+Grid ban placement). */
export const BAN_THUMB_MARKER_WIDTH_CLASS = 'w-[clamp(1rem,15%,1.5rem)]';

export function BanThumbMarker({
  status,
  className = '',
}: {
  status: BanDisplayStatus;
  className?: string;
}) {
  const { label } = banMarkerForStatus(status);
  const src = resolveYgoBanStatusIconPath(status, 'row');

  return (
    <span
      className={`pointer-events-none absolute left-0 top-0 z-[1] ${BAN_THUMB_MARKER_WIDTH_CLASS} drop-shadow-[0_0_2px_rgba(0,0,0,0.45)] ${className}`.trim()}
      title={label}
      aria-hidden
    >
      <span className="sr-only">{label}</span>
      {src ? (
        <img src={src} alt={label} className="block aspect-square w-full object-contain" />
      ) : (
        <span className="block text-xs">{label}</span>
      )}
    </span>
  );
}
