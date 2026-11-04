import type { FormatId } from '../format/formatCatalog.ts';

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
  updatedAt: string;
};

export type GuestDeckDraftInput = {
  name?: string;
  formatId?: FormatId;
  main?: number[];
  extra?: number[];
  side?: number[];
  genesysCap?: number | null;
};

export type GuestDeckDraftUpdate = {
  name?: string;
  formatId?: FormatId;
  main?: number[];
  extra?: number[];
  side?: number[];
  genesysCap?: number | null;
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
};
