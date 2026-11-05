import type { DragEvent } from 'react';

import { BanThumbMarker } from '../catalog/BanThumbMarker.tsx';
import { CatalogArtImage } from '../catalog/CatalogArtImage.tsx';
import { resolveCardBanForFormat } from '../catalog/formatBanContext.ts';
import { buildListRowTypeLine } from '../catalog/listRowModel.ts';
import type { FormatId } from '../format/formatCatalog.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

const stepperButtonClassName =
  'inline-flex min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-md border border-border bg-surface text-base text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:cursor-not-allowed disabled:opacity-40';

export function EditorCardRow({
  card,
  formatId,
  quantity,
  addLabel,
  removeLabel,
  onAdd,
  onRemove,
  draggable = false,
  onDragStart,
  testId,
}: {
  card: YugiohCard;
  formatId: FormatId;
  quantity: number;
  addLabel: string;
  removeLabel: string;
  onAdd: () => void;
  onRemove: () => void;
  draggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLLIElement>) => void;
  testId?: string;
}) {
  const typeLine = buildListRowTypeLine(card);
  const banStatus = resolveCardBanForFormat(card, formatId);

  return (
    <li
      data-testid={testId}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      className={`flex items-center gap-2 rounded-md border border-border bg-bg px-2 py-1 ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div className="relative w-9 shrink-0 overflow-hidden rounded-sm bg-surface-2">
        <CatalogArtImage
          card={card}
          imageId={card.id}
          size="small"
          alt=""
          loading="lazy"
          imgClassName="aspect-[59/86] w-full object-cover"
        />
        {banStatus ? <BanThumbMarker status={banStatus} /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-heading">{card.name}</p>
        {typeLine ? <p className="truncate text-xs text-text-2">{typeLine}</p> : null}
      </div>
      <div
        className="flex shrink-0 items-center"
        role="group"
        aria-label={`Copies of ${card.name}`}
      >
        <button
          type="button"
          className={stepperButtonClassName}
          aria-label={removeLabel}
          disabled={quantity <= 0}
          onClick={onRemove}
        >
          −
        </button>
        <span className="w-8 text-center text-sm tabular-nums text-heading">{quantity}</span>
        <button
          type="button"
          className={stepperButtonClassName}
          aria-label={addLabel}
          onClick={onAdd}
        >
          +
        </button>
      </div>
    </li>
  );
}
