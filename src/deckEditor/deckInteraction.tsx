import type { ReactNode } from 'react';

import { DeckInteractionContext, type DeckInteractionValue } from './deckInteractionContext.ts';

export function DeckInteractionProvider({
  value,
  children,
}: {
  value: DeckInteractionValue;
  children: ReactNode;
}) {
  return (
    <DeckInteractionContext.Provider value={value}>{children}</DeckInteractionContext.Provider>
  );
}
