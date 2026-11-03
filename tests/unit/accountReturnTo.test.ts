import { describe, expect, it } from 'vitest';

import {
  buildAccountPathWithReturn,
  buildDecksDraftReturnPath,
  parseSafeInAppReturnTo,
} from '../../src/shared/auth/accountUrl.ts';

describe('account return paths', () => {
  it('builds a decks draft return path', () => {
    expect(buildDecksDraftReturnPath('abc')).toBe('/decks?draft=abc');
  });

  it('accepts safe in-app return paths', () => {
    expect(parseSafeInAppReturnTo('/decks?draft=abc')).toBe('/decks?draft=abc');
    expect(parseSafeInAppReturnTo('https://evil.example/decks')).toBeNull();
    expect(parseSafeInAppReturnTo('/search')).toBeNull();
  });

  it('builds account links with encoded returnTo', () => {
    const returnTo = buildDecksDraftReturnPath('draft-1');
    expect(buildAccountPathWithReturn(returnTo)).toBe(
      `/account?returnTo=${encodeURIComponent(returnTo)}`,
    );
  });
});
