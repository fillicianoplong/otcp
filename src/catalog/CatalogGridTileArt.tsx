import { useState, type ReactNode } from 'react';

import type { YugiohCard } from '../shared/schema/card.ts';
import { CATALOG_GRID_TILE_ART_CLASS } from './catalogGridLayout.ts';

export function CatalogGridTileNamePlaceholder({ name }: { name: string }) {
  return (
    <div className="flex aspect-[59/86] w-full flex-col items-center justify-center gap-1 rounded-sm bg-surface-2 px-2 text-center text-xs text-text-2">
      <span className="font-medium leading-snug text-heading">{name}</span>
    </div>
  );
}

export function CatalogGridTileImage({ card, alt }: { card: YugiohCard; alt?: string }) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return <CatalogGridTileNamePlaceholder name={card.name} />;
  }

  return (
    <img
      src={card.images.small}
      alt={alt ?? card.name}
      loading="lazy"
      decoding="async"
      onError={() => setMissing(true)}
      className={CATALOG_GRID_TILE_ART_CLASS}
    />
  );
}

/** Relative frame for grid tile art and corner overlays (ban status, badges). */
export function CatalogGridTileFrame({ children }: { children: ReactNode }) {
  return <div className="relative w-full overflow-hidden leading-none">{children}</div>;
}
