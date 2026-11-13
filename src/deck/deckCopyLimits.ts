export type DeckEntryRef = {
  cardId: number;
  imageId?: number;
};

export function countDeckCopiesByCardId(entries: readonly DeckEntryRef[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const entry of entries) {
    counts.set(entry.cardId, (counts.get(entry.cardId) ?? 0) + 1);
  }
  return counts;
}

export function deckCopyCountForCard(entries: readonly DeckEntryRef[], cardId: number): number {
  let total = 0;
  for (const entry of entries) {
    if (entry.cardId === cardId) total += 1;
  }
  return total;
}

export function canAddDeckCopy(
  entries: readonly DeckEntryRef[],
  cardId: number,
  maxCopies: number,
): boolean {
  return deckCopyCountForCard(entries, cardId) < maxCopies;
}
