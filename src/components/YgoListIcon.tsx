/** Swappable row chip: readable text now; issue #32 can render icon assets by iconKey. */
export function YgoListIcon({
  iconKey,
  label,
  title,
  className = '',
}: {
  iconKey: string;
  label: string;
  title?: string;
  className?: string;
}) {
  const accessible = title ?? label;
  return (
    <span
      data-ygo-icon={iconKey}
      title={accessible}
      aria-label={accessible}
      className={`inline text-xs leading-snug text-text-2 ${className}`.trim()}
    >
      {label}
    </span>
  );
}
