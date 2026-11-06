import type { DragEvent } from 'react';

import { BanThumbMarker } from '../catalog/BanThumbMarker.tsx';
import { CatalogArtImage } from '../catalog/CatalogArtImage.tsx';
import { resolveCardBanForFormat } from '../catalog/formatBanContext.ts';
import type { FormatId } from '../format/formatCatalog.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

const stepperButtonClassName =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-sm leading-none text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:cursor-not-allowed disabled:opacity-40';

export function EditorCardTile({
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
  const banStatus = resolveCardBanForFormat(card, formatId);

  return (
    <li
      data-testid={testId}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      title={card.name}
      className={`flex min-w-0 flex-col ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="relative overflow-hidden rounded-sm bg-surface-2">
        <CatalogArtImage
          card={card}
          imageId={card.id}
          size="small"
          alt=""
          loading="lazy"
          imgClassName="aspect-[59/86] w-full object-cover"
        />
        {banStatus ? <BanThumbMarker status={banStatus} /> : null}
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-0.5 bg-bg/90 px-0.5 py-0.5"
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
          <span className="min-w-0 flex-1 truncate text-center text-xs tabular-nums text-heading">
            {quantity}
          </span>
          <button
            type="button"
            className={stepperButtonClassName}
            aria-label={addLabel}
            onClick={onAdd}
          >
            +
          </button>
        </div>
      </div>
      <span className="sr-only">{card.name}</span>
    </li>
  );
}
