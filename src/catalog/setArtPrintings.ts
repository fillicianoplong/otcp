import printings from './data/setArtPrintings.json';

/** One printing of a card: set code, set name, and the artwork id printed in that set. */
export type SetArtPrintingRow = readonly [setCode: string, setName: string, artId: number];

/** Printings keyed by card id, for cards with more than one artwork. */
export type SetArtPrintingsData = Record<string, readonly SetArtPrintingRow[]>;

const byCardId = printings as unknown as SetArtPrintingsData;

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
    const rows = byCardId[String(key)];
    if (rows && rows.length > 0) return rows;
  }
  return undefined;
}

export function setCodesMarkedForArt(
  card: number | SetArtCardRef,
  imageId: number,
): string[] | undefined {
  const rows = setArtPrintingsForCard(card);
  if (!rows) return undefined;
  return rows.filter(([, , artId]) => artId === imageId).map(([setCode]) => setCode);
}

export function isSetRowMarkedForSelectedArt(
  card: number | SetArtCardRef,
  imageId: number,
  setCode: string,
): boolean {
  const codes = setCodesMarkedForArt(card, imageId);
  if (!codes) return false;
  return codes.includes(setCode);
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
