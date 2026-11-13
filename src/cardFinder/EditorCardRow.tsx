import type { DragEvent } from 'react';

import { BanThumbMarker } from '../catalog/BanThumbMarker.tsx';
import { Button } from '../ui/Button.tsx';
import { ListThumb } from '../ui/ListRow.tsx';
import { editorRowClass } from '../ui/classes.ts';
import { CatalogArtImage } from '../catalog/CatalogArtImage.tsx';
import { resolveCardBanForFormat } from '../catalog/formatBanContext.ts';
import { buildListRowTypeLine } from '../catalog/listRowModel.ts';
import type { FormatId } from '../format/formatCatalog.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

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
      className={`${editorRowClass} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <ListThumb>
        <CatalogArtImage
          card={card}
          imageId={card.id}
          size="small"
          alt=""
          loading="lazy"
          imgClassName="aspect-card w-full object-cover"
        />
        {banStatus ? <BanThumbMarker status={banStatus} /> : null}
      </ListThumb>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-heading">{card.name}</p>
        {typeLine ? <p className="truncate text-xs text-text-2">{typeLine}</p> : null}
      </div>
      <div
        className="ml-auto flex shrink-0 items-center"
        role="group"
        aria-label={`Copies of ${card.name}`}
      >
        <Button variant="icon" aria-label={removeLabel} disabled={quantity <= 0} onClick={onRemove}>
          −
        </Button>
        <span className="w-8 text-center text-sm tabular-nums text-heading">{quantity}</span>
        <Button variant="icon" aria-label={addLabel} onClick={onAdd}>
          +
        </Button>
      </div>
    </li>
  );
}
