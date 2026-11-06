import { useId, useState } from 'react';
import { Link } from 'react-router';

import { CatalogArtImage } from '../catalog/CatalogArtImage.tsx';
import { resolveSelectedArtId } from '../catalog/cardArt.ts';
import { YGO_CARD_ART_ASPECT_CLASS } from '../catalog/cardArtUrl.ts';
import type { DeckCover } from '../deckStore/types.ts';
import { formatDisplayName, type FormatId } from '../format/formatCatalog.ts';
import { ygoprodeckSmallImageUrl } from '../shared/cardImageUrls.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { Menu, type MenuItem } from '../ui/Menu.tsx';
import { SectionHeader } from '../ui/SectionHeader.tsx';
import { quietIconButtonClass } from '../ui/classes.ts';
import { DeckCoverDialog } from './DeckCoverDialog.tsx';
import { resolveDisplayedCover, uniqueDeckCardIds, type DeckCoverSource } from './deckCover.ts';

const openOverlayClassName =
  'absolute inset-0 z-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

export type DeckListCardModel = DeckCoverSource & {
  id: string;
  name: string;
  formatId: FormatId;
  updatedAt: string;
  localDraft: boolean;
};

type DeckListCardProps = {
  deck: DeckListCardModel;
  cardsById: ReadonlyMap<number, YugiohCard>;
  highlighted?: boolean;
  openHref?: string;
  onOpen?: () => void;
  openBusy?: boolean;
  onRename: () => void;
  onRemove: () => void;
  onSave?: () => void;
  saveBusy?: boolean;
  saveAccountPath?: string | null;
  shareAccountPath?: string | null;
  shareDisabledTitle?: string;
  onChooseCover: (cover: DeckCover) => void;
};

function formatDeckUpdatedLabel(updatedAt: string): string {
  const updatedMs = Date.parse(updatedAt);
  if (Number.isNaN(updatedMs)) {
    return 'Updated unknown';
  }

  const diffMs = updatedMs - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (Math.abs(diffDays) >= 1) {
    return `Updated ${rtf.format(diffDays, 'day')}`;
  }

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) >= 1) {
    return `Updated ${rtf.format(diffHours, 'hour')}`;
  }

  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (Math.abs(diffMinutes) >= 1) {
    return `Updated ${rtf.format(diffMinutes, 'minute')}`;
  }

  return 'Updated just now';
}

function QuietCoverLabel({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-surface-2 px-1 text-center">
      <span className="text-xs text-text-2">{label}</span>
    </div>
  );
}

function DeckCoverVisual({
  card,
  cardId,
  artId,
}: {
  card: YugiohCard | null;
  cardId: number;
  artId: number;
}) {
  const [failed, setFailed] = useState(false);

  if (card) {
    return (
      <CatalogArtImage
        card={card}
        imageId={resolveSelectedArtId(card, artId)}
        size="small"
        alt={`${card.name} cover`}
        loading="lazy"
        imgClassName="absolute inset-0 h-full w-full object-cover object-left-top"
      />
    );
  }

  if (failed) {
    return <QuietCoverLabel label="No image" />;
  }

  return (
    <img
      src={ygoprodeckSmallImageUrl(artId)}
      alt={`Card ${cardId} cover`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover object-left-top"
    />
  );
}

export function DeckListCard({
  deck,
  cardsById,
  highlighted = false,
  openHref,
  onOpen,
  openBusy = false,
  onRename,
  onRemove,
  onSave,
  saveBusy = false,
  saveAccountPath = null,
  shareAccountPath = null,
  shareDisabledTitle = 'Share links are not available yet.',
  onChooseCover,
}: DeckListCardProps) {
  const nameId = useId().replace(/:/g, '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const displayed = resolveDisplayedCover(deck, cardsById);
  const coverCard = displayed ? (cardsById.get(displayed.cardId) ?? null) : null;
  const hasCards = uniqueDeckCardIds(deck).length > 0;

  const items: MenuItem[] = [
    openHref
      ? { key: 'open', label: 'Open', href: openHref }
      : {
          key: 'open',
          label: 'Open',
          disabled: openBusy,
          onSelect: onOpen,
        },
  ];

  if (onSave) {
    items.push({
      key: 'save',
      label: 'Save',
      disabled: saveBusy,
      onSelect: onSave,
    });
  } else if (saveAccountPath) {
    items.push({ key: 'save', label: 'Save', href: saveAccountPath });
  }

  if (shareAccountPath) {
    items.push({ key: 'share', label: 'Share', href: shareAccountPath });
  } else {
    items.push({
      key: 'share',
      label: 'Share',
      disabled: true,
      title: shareDisabledTitle,
    });
  }

  items.push(
    {
      key: 'cover',
      label: 'Choose cover',
      disabled: !hasCards,
      title: hasCards ? undefined : 'Add a card before choosing a cover.',
      onSelect: () => setPickerOpen(true),
    },
    { key: 'rename', label: 'Rename', onSelect: onRename },
    { key: 'remove', label: 'Remove', onSelect: onRemove },
  );

  return (
    <article
      className={`relative flex gap-3 rounded-md border border-border bg-surface p-3${
        highlighted ? ' ring-2 ring-border-strong' : ''
      }`}
      aria-labelledby={nameId}
    >
      {openHref ? (
        <Link to={openHref} aria-label={`Open ${deck.name}`} className={openOverlayClassName} />
      ) : (
        <button
          type="button"
          aria-label={`Open ${deck.name}`}
          className={openOverlayClassName}
          disabled={openBusy}
          onClick={onOpen}
        />
      )}

      <div className="pointer-events-none relative flex min-w-0 flex-1 gap-3">
        <div
          className={`relative w-[4.25rem] shrink-0 overflow-hidden rounded-sm border border-border bg-surface-2 ${YGO_CARD_ART_ASPECT_CLASS}`}
        >
          {displayed ? (
            <DeckCoverVisual card={coverCard} cardId={displayed.cardId} artId={displayed.artId} />
          ) : (
            <QuietCoverLabel label="No cards" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-1">
            <SectionHeader id={nameId} size="section" className="min-w-0 flex-1 break-words">
              {deck.name}
            </SectionHeader>
            <Menu
              label={`Actions for ${deck.name}`}
              triggerAriaLabel={`Actions for ${deck.name}`}
              trigger={
                <span aria-hidden="true" className="text-xl leading-none">
                  ⋯
                </span>
              }
              triggerClassName={quietIconButtonClass}
              rootClassName="pointer-events-auto z-10"
              focusFirstItem
              items={items}
            />
          </div>
          <p className="text-sm text-text">{formatDisplayName(deck.formatId)}</p>
          <p className="flex flex-wrap gap-x-3 text-sm text-text">
            <span>Main {deck.main.length}</span>
            <span>Extra {deck.extra.length}</span>
            <span>Side {deck.side.length}</span>
            {deck.skillId ? <span>Skill set</span> : null}
          </p>
          <p className="flex flex-wrap gap-x-3 text-sm text-text">
            <span>{formatDeckUpdatedLabel(deck.updatedAt)}</span>
            {deck.localDraft ? <span>Local draft</span> : null}
          </p>
        </div>
      </div>

      <DeckCoverDialog
        open={pickerOpen}
        deck={deck}
        cardsById={cardsById}
        onClose={() => setPickerOpen(false)}
        onSelect={(cover) => {
          setPickerOpen(false);
          onChooseCover(cover);
        }}
      />
    </article>
  );
}
