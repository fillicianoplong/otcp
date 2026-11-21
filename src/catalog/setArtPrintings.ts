import { useEffect, useSyncExternalStore } from 'react';

/** One printing of a card: set code, set name, the artwork id printed there, and its rarity. */
export type SetArtPrintingRow = readonly [
  setCode: string,
  setName: string,
  artId: number,
  rarity: string,
];

/**
 * The generated file (see pipeline/setArtPrintingsCli.ts). Set names and rarities are listed once
 * and each printing refers to them by index: [set code, set index, artwork id, rarity index].
 */
export type SetArtPrintingsFile = {
  sets: readonly string[];
  rarities: readonly string[];
  cards: Record<string, readonly (readonly [string, number, number, number])[]>;
};

let byCardId = new Map<string, readonly SetArtPrintingRow[]>();
let version = 0;
let loading: Promise<void> | undefined;
const listeners = new Set<() => void>();

/** Replaces the printings table (used by the loader and by tests). */
export function setSetArtPrintingsData(file: SetArtPrintingsFile): void {
  const next = new Map<string, readonly SetArtPrintingRow[]>();
  for (const [cardId, rows] of Object.entries(file.cards)) {
    next.set(
      cardId,
      rows.map(([setCode, setIndex, artId, rarityIndex]) => [
        setCode,
        file.sets[setIndex] ?? '',
        artId,
        file.rarities[rarityIndex] ?? '',
      ]),
    );
  }
  byCardId = next;
  version += 1;
  for (const listener of listeners) listener();
}

/** Loads the printings table once. It is a separate file so it stays out of the main bundle. */
export function loadSetArtPrintings(): Promise<void> {
  loading ??= import('./data/setArtPrintings.json').then((module) => {
    setSetArtPrintingsData(module.default as unknown as SetArtPrintingsFile);
  });
  return loading;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Starts loading the printings table and re-renders once it is ready. Returns a revision number. */
export function useSetArtPrintingsRevision(): number {
  useEffect(() => {
    void loadSetArtPrintings();
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
}

/**
 * A card by its catalog id. The passcode and artwork ids are checked too, since the catalog id
 * can be an alternate artwork's id rather than the passcode the printings are listed under.
 */
export type SetArtCardRef = {
  id: number;
  passcode?: number;
  artIds?: readonly number[];
};

function cardRef(card: number | SetArtCardRef): SetArtCardRef {
  return typeof card === 'number' ? { id: card } : card;
}

export function setArtPrintingsForCard(
  card: number | SetArtCardRef,
): readonly SetArtPrintingRow[] | undefined {
  const { id, passcode, artIds = [] } = cardRef(card);
  for (const key of [id, ...(passcode != null ? [passcode] : []), ...artIds]) {
    const rows = byCardId.get(String(key));
    if (rows && rows.length > 0) return rows;
  }
  return undefined;
}

/**
 * Whether a set row on the card page is a printing of the selected artwork. The rarity narrows it
 * down when one set code was printed with different artworks in different rarities.
 */
export function isSetRowMarkedForSelectedArt(
  card: number | SetArtCardRef,
  imageId: number,
  setCode: string,
  rarity?: string,
): boolean {
  const rows = setArtPrintingsForCard(card)?.filter(([code]) => code === setCode);
  if (!rows || rows.length === 0) return false;
  const sameRarity = rarity ? rows.filter((row) => row[3] === rarity) : [];
  return (sameRarity.length > 0 ? sameRarity : rows).some(([, , artId]) => artId === imageId);
}

export function hasCuratedSetArtPrintings(card: number | SetArtCardRef): boolean {
  return setArtPrintingsForCard(card) != null;
}

/** Artwork ids printed in any of the given sets, in printing order, without repeats. */
export function artIdsPrintedInSets(
  card: number | SetArtCardRef,
  setNames: ReadonlySet<string>,
): number[] {
  const rows = setArtPrintingsForCard(card);
  if (!rows) return [];
  const ids: number[] = [];
  for (const [, setName, artId] of rows) {
    if (setNames.has(setName) && !ids.includes(artId)) ids.push(artId);
  }
  return ids;
}
