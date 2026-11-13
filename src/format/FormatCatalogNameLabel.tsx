type FormatCatalogNameLabelProps = {
  name: string;
  /** Primary name styling (filter row vs formats list title). */
  nameClassName?: string;
};

export function formatCatalogOptionAriaLabel(name: string): string {
  return name;
}

export function FormatCatalogNameLabel({ name, nameClassName = '' }: FormatCatalogNameLabelProps) {
  return <span className={`truncate ${nameClassName}`.trim()}>{name}</span>;
}
