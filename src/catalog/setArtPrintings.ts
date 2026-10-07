import curated from './data/setArtPrintings.json';

export type SetArtPrintingsEntry = {
  sources: string[];
  byImageId: Record<string, string[]>;
};

const byCardId = curated as Record<string, SetArtPrintingsEntry>;

export function setArtPrintingsForCard(cardId: number): SetArtPrintingsEntry | undefined {
  return byCardId[String(cardId)];
}

export function setCodesMarkedForArt(cardId: number, imageId: number): string[] | undefined {
  const entry = setArtPrintingsForCard(cardId);
  if (!entry) return undefined;
  return entry.byImageId[String(imageId)];
}

export function isSetRowMarkedForSelectedArt(
  cardId: number,
  imageId: number,
  setCode: string,
): boolean {
  const codes = setCodesMarkedForArt(cardId, imageId);
  if (!codes) return false;
  return codes.includes(setCode);
}

export function hasCuratedSetArtPrintings(cardId: number): boolean {
  return setArtPrintingsForCard(cardId) != null;
}
