import { createContext } from 'react';

import type { CatalogState } from './loadCatalog.ts';

export type CardCatalogContextValue = {
  state: CatalogState;
  retry: () => void;
};

export const CardCatalogContext = createContext<CardCatalogContextValue | null>(null);
