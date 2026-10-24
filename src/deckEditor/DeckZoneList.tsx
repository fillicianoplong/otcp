import type { DragEvent } from 'react';

import { EditorCardRow } from '../cardFinder/EditorCardRow.tsx';
import type { FormatId } from '../format/formatCatalog.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import {
  DECK_ZONES,
  deckZoneLabel,
  deckZoneMax,
  groupZoneCardIds,
  type DeckZone,
} from './deckPlacement.ts';

export function DeckZoneList({
  formatId,
  zones,
  cardsById,
  dropEnabled,
  activeDropZone,
  onDragOverZone,
  onDragLeaveZone,
  onDropZone,
  onAddToZone,
  onRemoveFromZone,
}: {
  formatId: FormatId;
  zones: Record<DeckZone, readonly number[]>;
  cardsById: ReadonlyMap<number, YugiohCard>;
  dropEnabled: boolean;
  activeDropZone: DeckZone | null;
  onDragOverZone: (zone: DeckZone, event: DragEvent<HTMLElement>) => void;
  onDragLeaveZone: (zone: DeckZone, event: DragEvent<HTMLElement>) => void;
  onDropZone: (zone: DeckZone, event: DragEvent<HTMLElement>) => void;
  onAddToZone: (zone: DeckZone, card: YugiohCard) => void;
  onRemoveFromZone: (zone: DeckZone, cardId: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {DECK_ZONES.map((zone) => {
        const ids = zones[zone];
        const groups = groupZoneCardIds(ids);
        const label = deckZoneLabel(zone);
        const active = activeDropZone === zone;
        return (
          <section
            key={zone}
            data-testid={`deck-zone-${zone}`}
            aria-labelledby={`deck-zone-${zone}-heading`}
            className={`rounded-md border bg-surface p-4 ${
              active
                ? 'border-solid border-border-strong bg-surface-2'
                : 'border-dashed border-border'
            }`}
            onDragOver={
              dropEnabled
                ? (event) => {
                    onDragOverZone(zone, event);
                  }
                : undefined
            }
            onDragLeave={
              dropEnabled
                ? (event) => {
                    onDragLeaveZone(zone, event);
                  }
                : undefined
            }
            onDrop={
              dropEnabled
                ? (event) => {
                    onDropZone(zone, event);
                  }
                : undefined
            }
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id={`deck-zone-${zone}-heading`} className="text-base font-semibold text-heading">
                {label}
              </h2>
              <p
                className="text-sm tabular-nums text-text-2"
                data-testid={`deck-zone-${zone}-count`}
              >
                {ids.length} / {deckZoneMax(zone, formatId)}
              </p>
            </div>
            {groups.length === 0 ? (
              <p className="text-sm text-text-2">
                {dropEnabled ? 'Drop cards here.' : 'No cards yet.'}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {groups.map((entry) => {
                  const card = cardsById.get(entry.cardId);
                  if (!card) {
                    return (
                      <li
                        key={entry.cardId}
                        className="flex items-center justify-between gap-2 rounded-md border border-border bg-bg px-2 py-2"
                      >
                        <p className="text-sm text-heading">Card {entry.cardId}</p>
                        <button
                          type="button"
                          className="inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-md border border-border px-3 text-sm text-heading"
                          onClick={() => onRemoveFromZone(zone, entry.cardId)}
                        >
                          Remove one
                        </button>
                      </li>
                    );
                  }
                  return (
                    <EditorCardRow
                      key={card.id}
                      card={card}
                      formatId={formatId}
                      quantity={entry.qty}
                      addLabel={`Add ${card.name} to ${label}`}
                      removeLabel={`Remove one ${card.name} from ${label}`}
                      onAdd={() => onAddToZone(zone, card)}
                      onRemove={() => onRemoveFromZone(zone, card.id)}
                    />
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
