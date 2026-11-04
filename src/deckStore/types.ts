import type { FormatId } from '../format/formatCatalog.ts';

/** Guest deck draft persisted in browser storage until sign-in save (FR-27). */
export type GuestDeckDraft = {
  id: string;
  name: string;
  main: number[];
  extra: number[];
  side: number[];
  updatedAt: string;
};

export type GuestDeckDraftInput = {
  name?: string;
  main?: number[];
  extra?: number[];
  side?: number[];
};

export type GuestDeckDraftUpdate = {
  name?: string;
  main?: number[];
  extra?: number[];
  side?: number[];
};

/** Saved deck row owned by the signed-in user (Supabase). */
export type SavedDeck = {
  id: string;
  name: string;
  formatId: FormatId;
  main: number[];
  extra: number[];
  side: number[];
  updatedAt: string;
};

export type SavedDeckInput = {
  name: string;
  formatId?: FormatId;
  main?: number[];
  extra?: number[];
  side?: number[];
};

export type SavedDeckUpdate = {
  name?: string;
  formatId?: FormatId;
  main?: number[];
  extra?: number[];
  side?: number[];
};
