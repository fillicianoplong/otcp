import { describe, expect, it } from 'vitest';

import {
  deckSaveRequiresAccountPath,
  deckShareRequiresAccountPath,
} from '../../src/deckStore/deckSignInGate.ts';
import { buildDecksDraftReturnPath } from '../../src/shared/auth/accountUrl.ts';

describe('deckSignInGate', () => {
  it('sends guests to Account with a deck return path for Save', () => {
    const path = deckSaveRequiresAccountPath(false, 'draft-1');
    expect(path).toContain('/account?');
    expect(path).toContain(`returnTo=${encodeURIComponent(buildDecksDraftReturnPath('draft-1'))}`);
  });

  it('sends guests to Account with a deck return path for Share', () => {
    const path = deckShareRequiresAccountPath(false, 'draft-2');
    expect(path).toContain('/account?');
    expect(path).toContain(`returnTo=${encodeURIComponent(buildDecksDraftReturnPath('draft-2'))}`);
  });

  it('does not redirect signed-in users', () => {
    expect(deckSaveRequiresAccountPath(true, 'draft-1')).toBeNull();
    expect(deckShareRequiresAccountPath(true, 'draft-2')).toBeNull();
  });
});
