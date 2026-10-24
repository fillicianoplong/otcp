import { useEffect, useRef, useState } from 'react';

import type { YugiohCard } from '../shared/schema/card.ts';
import { ygoprodeckLargeImageUrl, ygoprodeckSmallImageUrl } from '../shared/cardImageUrls.ts';
import { bundledDevArtUrl } from './bundledDevArt.ts';
import { catalogLargeImageUrl, catalogSmallImageUrl, defaultArtId } from './cardArt.ts';
import { YGO_CARD_ART_ASPECT_CLASS } from './cardArtUrl.ts';

type CatalogArtImageSize = 'small' | 'large';

function primaryArtSrc(card: YugiohCard, imageId: number, size: CatalogArtImageSize): string {
  return size === 'small'
    ? catalogSmallImageUrl(card, imageId)
    : catalogLargeImageUrl(card, imageId);
}

function defaultArtSrc(card: YugiohCard, size: CatalogArtImageSize): string {
  return size === 'small' ? card.images.small : card.images.large;
}

function NamedArtPlaceholder({
  cardName,
  className,
  compact,
}: {
  cardName: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-sm border border-border bg-surface-2 text-center text-text-2 ${className ?? ''} ${
        compact ? 'px-1 py-1 text-[9px] leading-tight' : 'px-2 py-3 text-xs'
      }`}
    >
      <span className="font-medium text-heading">{cardName}</span>
    </div>
  );
}

function ygoproArtSrc(imageId: number, size: CatalogArtImageSize): string {
  return size === 'small' ? ygoprodeckSmallImageUrl(imageId) : ygoprodeckLargeImageUrl(imageId);
}

function CatalogArtImageInner({
  card,
  imageId,
  size = 'small',
  className,
  imgClassName,
  alt = '',
  loading,
  onResolvedSrc,
}: {
  card: YugiohCard;
  imageId: number;
  size?: CatalogArtImageSize;
  className?: string;
  imgClassName?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
  onResolvedSrc?: (src: string) => void;
}) {
  const [src, setSrc] = useState(() => primaryArtSrc(card, imageId, size));
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const triedSrcRef = useRef(new Set<string>([primaryArtSrc(card, imageId, size)]));

  useEffect(() => {
    if (!showPlaceholder) {
      onResolvedSrc?.(src);
    }
  }, [onResolvedSrc, showPlaceholder, src]);

  if (showPlaceholder) {
    const fillParent = imgClassName?.includes('absolute') ?? false;
    return (
      <NamedArtPlaceholder
        cardName={card.name}
        className={`${YGO_CARD_ART_ASPECT_CLASS} w-full ${fillParent ? 'absolute inset-0 h-full' : ''} ${className ?? ''}`}
        compact={size === 'small'}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => {
        triedSrcRef.current.add(src);
        const candidates = [
          bundledDevArtUrl(imageId, size),
          ygoproArtSrc(imageId, size),
          imageId === defaultArtId(card) ? defaultArtSrc(card, size) : null,
        ].filter((candidate): candidate is string => Boolean(candidate && candidate.length > 0));

        for (const candidate of candidates) {
          if (!triedSrcRef.current.has(candidate)) {
            setSrc(candidate);
            return;
          }
        }
        setShowPlaceholder(true);
      }}
      className={imgClassName ?? `${YGO_CARD_ART_ASPECT_CLASS} w-full ${className ?? ''}`}
    />
  );
}

export function CatalogArtImage(props: {
  card: YugiohCard;
  imageId: number;
  size?: CatalogArtImageSize;
  className?: string;
  imgClassName?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
  onResolvedSrc?: (src: string) => void;
}) {
  return (
    <CatalogArtImageInner
      key={`${props.card.id}-${props.imageId}-${props.size ?? 'small'}`}
      {...props}
    />
  );
}

export function CatalogArtThumbnail({
  card,
  imageId,
  selected,
  onSelect,
  ariaLabel,
}: {
  card: YugiohCard;
  imageId: number;
  selected: boolean;
  onSelect: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
      className={`${YGO_CARD_ART_ASPECT_CLASS} w-14 shrink-0 overflow-hidden rounded-sm border-2 bg-surface-2 p-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong ${
        selected
          ? 'border-heading ring-2 ring-heading ring-offset-2 ring-offset-surface'
          : 'border-border opacity-80 hover:opacity-100'
      }`}
    >
      <CatalogArtImage
        card={card}
        imageId={imageId}
        size="small"
        imgClassName="h-full w-full object-contain"
        alt=""
      />
    </button>
  );
}
