export function formatCardCount(count: number): string {
  return count === 1 ? '1 card' : `${count.toLocaleString()} cards`;
}

export function formatArtworkCount(count: number): string {
  return count === 1 ? '1 artwork' : `${count.toLocaleString()} artworks`;
}

export function formatCatalogResultCount(count: number): string {
  return formatCardCount(count);
}
