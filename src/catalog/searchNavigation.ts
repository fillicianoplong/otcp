import type { FormatId } from '../format/formatCatalog.ts';

/** Location state for `/search/card/:id` back navigation. */
export type CardDetailLinkState = {
  fromSearch?: boolean;
  returnFormatId?: FormatId;
};

export function cardDetailLinkStateFromSearch(): CardDetailLinkState {
  return { fromSearch: true };
}

export function cardDetailLinkStateFromFormat(formatId: FormatId): CardDetailLinkState {
  return { returnFormatId: formatId };
}
