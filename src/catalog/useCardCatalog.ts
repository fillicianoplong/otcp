import { useContext } from 'react';

import { CardCatalogContext } from './cardCatalogContext.ts';

export function useCardCatalog() {
  const ctx = useContext(CardCatalogContext);
  if (!ctx) {
    throw new Error('useCardCatalog must be used within CardCatalogProvider.');
  }
  return ctx;
}
