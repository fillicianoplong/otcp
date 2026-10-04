import type { BanlistChangeBadge } from './banlistDiff.ts';

export function BanlistChangeBadgeMarker({
  badge,
  className = '',
}: {
  badge: BanlistChangeBadge;
  className?: string;
}) {
  return (
    <span
      className={`pointer-events-none absolute bottom-0.5 right-0.5 z-[2] rounded-sm bg-surface/90 px-1 py-px text-[10px] font-semibold leading-tight text-heading shadow-sm ring-1 ring-border ${className}`.trim()}
    >
      {badge}
    </span>
  );
}
