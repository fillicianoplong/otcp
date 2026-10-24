import { useEffect, useMemo, useState } from 'react';

import { resolveArtIds } from './cardArt.ts';
import { fetchYgoproArtIdsForPasscodes } from './ygoproArtIds.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

const WARM_BATCH_SIZE = 80;
const WARM_BATCH_DELAY_MS = 40;

function passcodesNeedingArtLookup(cards: readonly YugiohCard[]): number[] {
  const ids: number[] = [];
  for (const card of cards) {
    if (resolveArtIds(card).length <= 1) {
      ids.push(card.id);
    }
  }
  return ids;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** Background YGOPro lookups so alternate arts resolve for the whole catalog, not only visible rows. */
export function useCatalogArtIdWarm(cards: readonly YugiohCard[] | null | undefined): number {
  const disabled = import.meta.env.VITE_DISABLE_CATALOG_ART_WARM === 'true';
  const passcodes = useMemo(() => {
    if (disabled || !cards || cards.length === 0) return [];
    return passcodesNeedingArtLookup(cards);
  }, [cards, disabled]);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (disabled || passcodes.length === 0) return;

    let cancelled = false;

    void (async () => {
      for (let offset = 0; offset < passcodes.length; offset += WARM_BATCH_SIZE) {
        if (cancelled) return;
        const batch = passcodes.slice(offset, offset + WARM_BATCH_SIZE);
        await fetchYgoproArtIdsForPasscodes(batch);
        if (!cancelled) {
          setRevision((current) => current + 1);
        }
        if (offset + WARM_BATCH_SIZE < passcodes.length) {
          await sleep(WARM_BATCH_DELAY_MS);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [disabled, passcodes]);

  return disabled ? 0 : revision;
}
