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
