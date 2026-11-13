import { createContext, useContext } from 'react';

import type { DeckDragPayload, DeckZone } from './deckPlacement.ts';

export type DeckTileAction = 'add' | 'remove' | DeckZone;

export type DeckDropTarget = 'main' | 'extra' | 'side' | 'library' | 'away';

export type DeckTouchPhase = 'move' | 'end';

export type DeckInteractionValue = {
  tileSizePx: number;
  helpId: string;
  phoneControls: boolean;
  selectedTileId: string | null;
  selectTile: (id: string, zone: DeckZone | null) => void;
  onPhoneAdd: (payload: DeckDragPayload) => void;
  onPhoneRemove: (payload: DeckDragPayload) => void;
  copyCount: (cardId: number) => number;
  onDragPayload: (payload: DeckDragPayload) => void;
  onKeyAction: (payload: DeckDragPayload, action: DeckTileAction) => void;
  onTouchDrag: (
    phase: DeckTouchPhase,
    point: { x: number; y: number } | null,
    payload: DeckDragPayload,
  ) => void;
};

export const DeckInteractionContext = createContext<DeckInteractionValue | null>(null);

export function useDeckInteraction(): DeckInteractionValue {
  const value = useContext(DeckInteractionContext);
  if (!value) {
    throw new Error('Deck tiles are outside the deck editor.');
  }
  return value;
}

export function readDropTarget(target: EventTarget | null): Exclude<DeckDropTarget, 'away'> | null {
  if (!(target instanceof Element)) return null;
  const host = target.closest('[data-drop]');
  const value = host?.getAttribute('data-drop');
  if (value === 'main' || value === 'extra' || value === 'side' || value === 'library') {
    return value;
  }
  return null;
}
