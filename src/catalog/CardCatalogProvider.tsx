import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { CardCatalogContext } from './cardCatalogContext.ts';
import { getCardCatalog, reloadCardCatalog, type CatalogState } from './loadCatalog.ts';

export function CardCatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>({ status: 'loading' });

  const applyLoaded = useCallback((loaded: Exclude<CatalogState, { status: 'loading' }>) => {
    setState(loaded);
  }, []);

  useEffect(() => {
    void getCardCatalog().then(applyLoaded);
  }, [applyLoaded]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    void reloadCardCatalog().then(applyLoaded);
  }, [applyLoaded]);

  const value = useMemo(() => ({ state, retry }), [state, retry]);

  return <CardCatalogContext.Provider value={value}>{children}</CardCatalogContext.Provider>;
}
