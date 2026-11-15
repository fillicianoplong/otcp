import { CATALOG_GRID_CLASS, FORMAT_BANLIST_GRID_CLASS } from '../catalog/catalogGridLayout.ts';

/**
 * Column counts:
 * - search: 4 from 360px through tablet, 6 from 1024px (2 below 360px)
 * - library: 4 across the deck side search (the caller may pass fewer when the panel is narrow)
 * - deck: 4 on phone, 10 from 1024px
 * - lists: 4 for Lists and Collection
 * - banlist: format detail, 4 on phone and 10 from 1024px
 */
export type CardGridVariant = 'search' | 'library' | 'deck' | 'lists' | 'banlist';

export function cardGridClassName(variant: CardGridVariant): string {
  switch (variant) {
    case 'search':
      return CATALOG_GRID_CLASS;
    case 'library':
      return 'grid w-full min-w-0 grid-cols-4';
    case 'deck':
      return 'grid w-full min-w-0 justify-start grid-cols-4 lg:grid-cols-10';
    case 'lists':
      return 'grid grid-cols-4 items-start gap-catalog';
    case 'banlist':
      return FORMAT_BANLIST_GRID_CLASS;
  }
}
