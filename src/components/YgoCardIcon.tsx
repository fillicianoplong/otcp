import type { YgoIconTier } from '../catalog/cardIcons.ts';

const TIER_PX: Record<YgoIconTier, number> = {
  row: 16,
  detail: 18,
};

export function YgoCardIcon({
  src,
  label,
  tier = 'row',
  className = '',
  iconOnly = false,
}: {
  src: string | null | undefined;
  label: string;
  tier?: YgoIconTier;
  className?: string;
  /** When true, the image carries the accessible name and no duplicate text is shown. */
  iconOnly?: boolean;
}) {
  const px = TIER_PX[tier];

  if (!src) {
    return <span className={className}>{label}</span>;
  }

  if (iconOnly) {
    return (
      <img
        src={src}
        alt={label}
        width={px}
        height={px}
        className={`inline-block shrink-0 object-contain ${className}`.trim()}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`.trim()}>
      <img
        src={src}
        alt=""
        aria-hidden
        width={px}
        height={px}
        className="inline-block shrink-0 object-contain"
        style={{ width: px, height: px }}
      />
      <span>{label}</span>
    </span>
  );
}
