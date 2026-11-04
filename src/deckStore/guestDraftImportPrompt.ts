import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';

export const GUEST_DRAFT_IMPORT_DECLINED_STORAGE_KEY = 'otcp:guest-deck-import-declined:v1';

const declinedEnvelopeSchemaVersion = 1 as const;

type DeclinedEnvelope = {
  version: typeof declinedEnvelopeSchemaVersion;
  draftIds: string[];
};

function readDeclinedEnvelope(): DeclinedEnvelope {
  const raw = readLocalStorageString(GUEST_DRAFT_IMPORT_DECLINED_STORAGE_KEY);
  if (raw === null) {
    return { version: declinedEnvelopeSchemaVersion, draftIds: [] };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as DeclinedEnvelope).version === declinedEnvelopeSchemaVersion &&
      Array.isArray((parsed as DeclinedEnvelope).draftIds)
    ) {
      const draftIds = (parsed as DeclinedEnvelope).draftIds.filter(
        (id): id is string => typeof id === 'string' && id.length > 0,
      );
      return { version: declinedEnvelopeSchemaVersion, draftIds };
    }
  } catch {
    // ignore
  }

  return { version: declinedEnvelopeSchemaVersion, draftIds: [] };
}

function writeDeclinedEnvelope(draftIds: string[]): void {
  const unique = [...new Set(draftIds.filter((id) => id.length > 0))];
  const envelope: DeclinedEnvelope = {
    version: declinedEnvelopeSchemaVersion,
    draftIds: unique,
  };
  writeLocalStorageString(GUEST_DRAFT_IMPORT_DECLINED_STORAGE_KEY, JSON.stringify(envelope));
}

/** Draft ids the user declined to import on this browser profile (sticky). */
export function listDeclinedGuestDraftImportIds(): string[] {
  return readDeclinedEnvelope().draftIds;
}

export function markGuestDraftImportDeclined(draftId: string): void {
  if (!draftId) {
    return;
  }
  const current = readDeclinedEnvelope().draftIds;
  if (current.includes(draftId)) {
    return;
  }
  writeDeclinedEnvelope([...current, draftId]);
}

export function markGuestDraftImportsDeclined(draftIds: readonly string[]): void {
  writeDeclinedEnvelope([...readDeclinedEnvelope().draftIds, ...draftIds]);
}

/** Guest drafts that have not been permanently declined for import. */
export function guestDraftIdsPendingImport(allDraftIds: readonly string[]): string[] {
  const declined = new Set(listDeclinedGuestDraftImportIds());
  return allDraftIds.filter((id) => !declined.has(id));
}

export function shouldOfferGuestDraftImport(options: {
  signedIn: boolean;
  guestDraftIds: readonly string[];
}): boolean {
  if (!options.signedIn) {
    return false;
  }
  return guestDraftIdsPendingImport(options.guestDraftIds).length > 0;
}

/** Clear declined-import storage (tests). */
export function clearGuestDraftImportDeclinedStorage(): void {
  writeLocalStorageString(GUEST_DRAFT_IMPORT_DECLINED_STORAGE_KEY, '');
  try {
    localStorage.removeItem(GUEST_DRAFT_IMPORT_DECLINED_STORAGE_KEY);
  } catch {
    // ignore
  }
}
