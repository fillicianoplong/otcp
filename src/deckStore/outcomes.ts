export type DeckStoreError = {
  ok: false;
  code: 'unauthorized' | 'not_found' | 'error';
  message: string;
  retryable: boolean;
};

export type DeckStoreOk<T extends Record<string, unknown> | undefined = undefined> =
  T extends undefined ? { ok: true } : { ok: true } & T;

export type DeckStoreResult<T extends Record<string, unknown> | undefined = undefined> =
  DeckStoreOk<T> | DeckStoreError;
