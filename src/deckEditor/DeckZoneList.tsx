import { useLayoutEffect, useRef, type DragEvent } from 'react';

import { Button } from '../ui/Button.tsx';
import { CardGrid } from '../ui/CardGrid.tsx';
import { SectionHeader } from '../ui/SectionHeader.tsx';
import { EditorCardRow } from '../cardFinder/EditorCardRow.tsx';
import type { FormatId } from '../format/formatCatalog.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { DeckArtTile } from './DeckArtTile.tsx';
import type { DeckDropTarget } from './deckInteractionContext.ts';
import { orderZoneCards, type DeckZoneSortMode } from './deckZoneSort.ts';
import { type DeckZoneViewMode } from './deckZoneView.ts';
import { deckTileSizePx } from './deckTileSize.ts';
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
  columns,
  tileSizePx,
  highlight,
  onTileSize,
  viewMode,
  sortMode,
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
  columns: number;
  tileSizePx: number;
  highlight: DeckDropTarget | null;
  onTileSize: (px: number) => void;
  viewMode: DeckZoneViewMode;
  sortMode: DeckZoneSortMode;
}) {
  const measureRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return undefined;
    const measure = () => {
      const style = getComputedStyle(el);
      const pad =
        (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0);
      onTileSize(deckTileSizePx(el.clientWidth - pad, columns));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns, onTileSize]);
  const tile = tileSizePx > 0 ? `${tileSizePx}px` : '4.5rem';

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {DECK_ZONES.map((zone) => {
        const ids = zones[zone];
        const ordered = orderZoneCards(ids, cardsById, sortMode);
        const groups = groupZoneCardIds(ordered.map((entry) => entry.cardId));
        const label = deckZoneLabel(zone);
        const active = activeDropZone === zone;
        return (
          <section
            key={zone}
            ref={zone === 'main' ? measureRef : undefined}
            data-testid={`deck-zone-${zone}`}
            data-drop={zone}
            aria-labelledby={`deck-zone-${zone}-heading`}
            className={`min-w-0 rounded-md border bg-surface p-4 ${
              active || highlight === zone
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
            <div className="mb-3 flex items-center justify-between gap-3">
              <SectionHeader id={`deck-zone-${zone}-heading`}>{label}</SectionHeader>
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
            ) : viewMode === 'grid' ? (
              <CardGrid
                variant="deck"
                style={{
                  gridTemplateColumns: `repeat(${columns}, ${tile})`,
                  gap: 'var(--tile-gap)',
                }}
                data-view="grid"
              >
                {ordered.map((entry) => {
                  const card = cardsById.get(entry.cardId);
                  if (!card) {
                    return (
                      <li
                        key={`${entry.cardId}-${entry.sourceIndex}`}
                        className="min-w-0 text-xs text-heading"
                        style={{ width: tile }}
                      >
                        Card {entry.cardId}
                      </li>
                    );
                  }
                  return (
                    <li
                      key={`${card.id}-${entry.sourceIndex}`}
                      className="min-w-0"
                      style={{ width: tile }}
                    >
                      <DeckArtTile
                        card={card}
                        formatId={formatId}
                        payload={{ cardId: card.id, from: zone, sourceIndex: entry.sourceIndex }}
                        label={`${card.name} in ${label}. Delete removes it. M, E, or S moves it.`}
                        testId={`zone-card-${zone}-${entry.sourceIndex}`}
                        tileId={`zone-${zone}-${entry.sourceIndex}`}
                      />
                    </li>
                  );
                })}
              </CardGrid>
            ) : (
              <ul className="flex flex-col gap-2" data-view="list">
                {groups.map((entry) => {
                  const card = cardsById.get(entry.cardId);
                  if (!card) {
                    return (
                      <li
                        key={entry.cardId}
                        className="flex items-center justify-between gap-2 rounded-md border border-border bg-bg px-2 py-2"
                      >
                        <p className="text-sm text-heading">Card {entry.cardId}</p>
                        <Button onClick={() => onRemoveFromZone(zone, entry.cardId)}>
                          Remove one
                        </Button>
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
