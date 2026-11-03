import {
  buildAccountPathWithReturn,
  buildDecksDraftReturnPath,
} from '../shared/auth/accountUrl.ts';

/** Account URL for deck Share when the guest must sign in first. */
export function deckShareRequiresAccountPath(isSignedIn: boolean, draftId: string): string | null {
  if (isSignedIn) {
    return null;
  }
  return buildAccountPathWithReturn(buildDecksDraftReturnPath(draftId));
}

/** Account URL for deck Save when the guest must sign in first. */
export function deckSaveRequiresAccountPath(isSignedIn: boolean, draftId: string): string | null {
  if (isSignedIn) {
    return null;
  }
  return buildAccountPathWithReturn(buildDecksDraftReturnPath(draftId));
}
