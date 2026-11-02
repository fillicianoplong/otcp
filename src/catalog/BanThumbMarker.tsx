import { banMarkerForStatus, type BanDisplayStatus } from './formatBanContext.ts';
import { resolveYgoBanStatusIconPath } from './cardIcons.ts';
import { YgoCardIcon } from '../components/YgoCardIcon.tsx';

export function BanThumbMarker({
  status,
  className = '',
}: {
  status: BanDisplayStatus;
  className?: string;
}) {
  const { label } = banMarkerForStatus(status);
  return (
    <span
      className={`pointer-events-none absolute left-0.5 top-0.5 z-[1] drop-shadow-[0_0_2px_rgba(0,0,0,0.45)] ${className}`.trim()}
      title={label}
      aria-hidden
    >
      <span className="sr-only">{label}</span>
      <YgoCardIcon
        src={resolveYgoBanStatusIconPath(status, 'row')}
        label={label}
        tier="row"
        iconOnly
      />
    </span>
  );
}
