export function formatCardCount(count: number): string {
  return count === 1 ? '1 card' : `${count.toLocaleString()} cards`;
}
