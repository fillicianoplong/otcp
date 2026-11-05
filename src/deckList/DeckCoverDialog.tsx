import { useEffect, useId, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

import { CatalogArtImage } from '../catalog/CatalogArtImage.tsx';
import { YGO_CARD_ART_ASPECT_CLASS } from '../catalog/cardArtUrl.ts';
import type { DeckCover } from '../deckStore/types.ts';
import { ygoprodeckSmallImageUrl } from '../shared/cardImageUrls.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { listDeckCoverOptions, type DeckCoverSource } from './deckCover.ts';

const closeButtonClassName =
  'inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

type DeckCoverDialogProps = {
  open: boolean;
  deck: DeckCoverSource & { name: string };
  cardsById: ReadonlyMap<number, YugiohCard>;
  onSelect: (cover: DeckCover) => void;
  onClose: () => void;
};

export function DeckCoverDialog({
  open,
  deck,
  cardsById,
  onSelect,
  onClose,
}: DeckCoverDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const options = useMemo(() => listDeckCoverOptions(deck, cardsById), [cardsById, deck]);

  useEffect(() => {
    if (!open) {
      return;
    }
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const selected = deck.cover ?? null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[min(40rem,calc(100dvh-2rem))] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-md border border-border bg-surface p-4 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg font-semibold text-heading">
              Choose cover
            </h2>
            <p className="text-sm text-text">
              Pick a card from {deck.name}. Each artwork can be the front of this deck in the list.
            </p>
          </div>
          <button ref={closeRef} type="button" className={closeButtonClassName} onClick={onClose}>
            Close
          </button>
        </div>
        <ul className="grid grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
          {options.map((option) => {
            const card = cardsById.get(option.cardId) ?? null;
            const pressed = selected?.cardId === option.cardId && selected.artId === option.artId;
            return (
              <li key={`${option.cardId}-${option.artId}`}>
                <button
                  type="button"
                  aria-pressed={pressed}
                  aria-label={option.label}
                  onClick={() => onSelect({ cardId: option.cardId, artId: option.artId })}
                  className={`${YGO_CARD_ART_ASPECT_CLASS} w-full overflow-hidden rounded-sm border-2 bg-surface-2 p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong ${
                    pressed
                      ? 'border-heading ring-2 ring-heading ring-offset-2 ring-offset-surface'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  {card ? (
                    <CatalogArtImage
                      card={card}
                      imageId={option.artId}
                      size="small"
                      alt=""
                      imgClassName="h-full w-full object-cover object-left-top"
                    />
                  ) : (
                    <img
                      src={ygoprodeckSmallImageUrl(option.artId)}
                      alt=""
                      className="h-full w-full object-cover object-left-top"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
