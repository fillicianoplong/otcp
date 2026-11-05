import type { FormatId } from '../format/formatCatalog.ts';

/** Card and artwork shown on a deck list card. */
export type DeckCover = {
  cardId: number;
  artId: number;
};

/** Guest deck draft persisted in browser storage until sign-in save (FR-27). */
export type GuestDeckDraft = {
  id: string;
  name: string;
  formatId: FormatId;
  main: number[];
  extra: number[];
  side: number[];
  /** User-set Genesys cap; omitted uses default 100 when format is Genesys. */
  genesysCap?: number;
  skillId?: number | null;
  /** Chosen list cover. Absent until the user picks one. */
  cover?: DeckCover;
  updatedAt: string;
};

export type GuestDeckDraftInput = {
  name?: string;
  formatId?: FormatId;
  main?: number[];
  extra?: number[];
  side?: number[];
  genesysCap?: number | null;
  skillId?: number | null;
  cover?: DeckCover | null;
};

export type GuestDeckDraftUpdate = {
  name?: string;
  formatId?: FormatId;
  main?: number[];
  extra?: number[];
  side?: number[];
  genesysCap?: number | null;
  skillId?: number | null;
  /** Pass null to clear a chosen cover. */
  cover?: DeckCover | null;
};

/** Saved deck row owned by the signed-in user (Supabase). */
export type SavedDeck = {
  id: string;
  name: string;
  formatId: FormatId;
  main: number[];
  extra: number[];
  side: number[];
  genesysCap?: number;
  /** Chosen list cover. The deck row has no cover column, so this is filled from local storage. */
  cover?: DeckCover;
  updatedAt: string;
};

export type SavedDeckInput = {
  name: string;
  formatId?: FormatId;
  main?: number[];
  extra?: number[];
  side?: number[];
  genesysCap?: number | null;
};

export type SavedDeckUpdate = {
  name?: string;
  formatId?: FormatId;
  main?: number[];
  extra?: number[];
  side?: number[];
  genesysCap?: number | null;
  /** Pass null to clear a chosen cover. */
  cover?: DeckCover | null;
};
