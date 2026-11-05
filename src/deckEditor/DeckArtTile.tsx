import {
  useRef,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { BanThumbMarker } from '../catalog/BanThumbMarker.tsx';
import { CatalogArtImage } from '../catalog/CatalogArtImage.tsx';
import { resolveCardBanForFormat } from '../catalog/formatBanContext.ts';
import type { FormatId } from '../format/formatCatalog.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import type { DeckTileAction } from './deckInteractionContext.ts';
import { useDeckInteraction } from './deckInteractionContext.ts';
import type { DeckDragPayload } from './deckPlacement.ts';
import { deckZoneLabel, writeDeckDrag } from './deckPlacement.ts';

const HOLD_MS = 220;

/** Art-only tile. Drag moves or adds it. The keyboard does the same without a control on the art. */
export function DeckArtTile({
  card,
  formatId,
  payload,
  label,
  testId,
  tileId,
}: {
  card: YugiohCard;
  formatId: FormatId;
  payload: DeckDragPayload;
  label: string;
  testId?: string;
  tileId: string;
}) {
  const {
    helpId,
    phoneControls,
    selectedTileId,
    selectTile,
    onPhoneAdd,
    onPhoneRemove,
    copyCount,
    onDragPayload,
    onKeyAction,
    onTouchDrag,
  } = useDeckInteraction();
  const selected = phoneControls && selectedTileId === tileId;
  const zoneLabel = payload.from === 'library' ? null : deckZoneLabel(payload.from);
  const addLabel = zoneLabel ? `Add ${card.name} to ${zoneLabel}` : `Add ${card.name}`;
  const removeLabel = zoneLabel
    ? `Remove one ${card.name} from ${zoneLabel}`
    : `Remove one ${card.name}`;
  const canRemove = payload.from === 'library' ? copyCount(card.id) > 0 : true;
  const banStatus = resolveCardBanForFormat(card, formatId);
  const holdRef = useRef<number | null>(null);
  const dragRef = useRef(false);

  const onDragStartEvent = (event: DragEvent<HTMLDivElement>) => {
    writeDeckDrag(event.dataTransfer, payload);
    onDragPayload(payload);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const act = (action: DeckTileAction) => {
      event.preventDefault();
      onKeyAction(payload, action);
    };
    if (payload.from === 'library') {
      if (event.key !== 'Enter') return;
      act('add');
      return;
    }
    const key = event.key.toLowerCase();
    if (event.key === 'Delete' || event.key === 'Backspace') {
      act('remove');
      return;
    }
    if (key === 'm') act('main');
    else if (key === 'e') act('extra');
    else if (key === 's') act('side');
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    const node = event.currentTarget;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    dragRef.current = false;
    holdRef.current = window.setTimeout(() => {
      dragRef.current = true;
      node.setPointerCapture(pointerId);
      onTouchDrag('move', { x: startX, y: startY }, payload);
    }, HOLD_MS);

    const finish = (ev: PointerEvent, phase: 'move' | 'end') => {
      if (!dragRef.current) return;
      if (phase === 'move') ev.preventDefault();
      onTouchDrag(phase, { x: ev.clientX, y: ev.clientY }, payload);
    };
    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 12 && holdRef.current != null) {
          window.clearTimeout(holdRef.current);
          holdRef.current = null;
          cleanup();
        }
        return;
      }
      finish(ev, 'move');
    };
    const onUp = (ev: PointerEvent) => {
      if (holdRef.current != null) window.clearTimeout(holdRef.current);
      if (dragRef.current) finish(ev, 'end');
      dragRef.current = false;
      cleanup();
    };
    const cleanup = () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerup', onUp);
      node.removeEventListener('pointercancel', onUp);
    };
    node.addEventListener('pointermove', onMove, { passive: false });
    node.addEventListener('pointerup', onUp);
    node.addEventListener('pointercancel', onUp);
  };

  return (
    <div
      role="group"
      tabIndex={0}
      data-testid={testId}
      data-tile-root
      data-card-name={card.name}
      aria-label={label}
      aria-describedby={helpId}
      draggable
      onDragStart={onDragStartEvent}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onClick={
        phoneControls
          ? (event) => {
              event.stopPropagation();
              selectTile(tileId, payload.from === 'library' ? null : payload.from);
            }
          : undefined
      }
      className="relative w-full cursor-grab rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong active:cursor-grabbing"
    >
      <div className="relative overflow-hidden rounded-sm bg-surface-2">
        <CatalogArtImage
          card={card}
          imageId={card.id}
          size="small"
          alt=""
          loading="lazy"
          imgClassName="pointer-events-none aspect-[59/86] w-full object-contain"
        />
        {banStatus ? <BanThumbMarker status={banStatus} /> : null}
      </div>
      {selected ? (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-bg/80"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="inline-flex min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-md border border-border bg-surface text-base text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
            aria-label={addLabel}
            onClick={(event) => {
              event.stopPropagation();
              onPhoneAdd(payload);
            }}
          >
            +
          </button>
          <button
            type="button"
            className="inline-flex min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-md border border-border bg-surface text-base text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={removeLabel}
            disabled={!canRemove}
            onClick={(event) => {
              event.stopPropagation();
              onPhoneRemove(payload);
            }}
          >
            −
          </button>
        </div>
      ) : null}
      <span className="sr-only">{card.name}</span>
    </div>
  );
}
