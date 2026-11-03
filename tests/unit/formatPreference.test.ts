/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';

import {
  readFormatPreference,
  resolveFormatPreference,
  writeFormatPreference,
} from '../../src/format/formatPreference.ts';

describe('formatPreference', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('prefers the URL format param over stored preference', () => {
    const resolved = resolveFormatPreference({
      urlParam: 'traditional',
      storedRaw: 'advanced',
    });
    expect(resolved.formatId).toBe('traditional');
  });

  it('falls back to stored preference when the URL has no format', () => {
    const resolved = resolveFormatPreference({
      urlParam: null,
      storedRaw: 'advanced',
    });
    expect(resolved.formatId).toBe('advanced');
  });

  it('ignores invalid stored values', () => {
    const resolved = resolveFormatPreference({
      urlParam: null,
      storedRaw: 'edison',
    });
    expect(resolved.formatId).toBeNull();
    expect(resolved.invalidStored).toBe(true);
  });

  it('writes and clears localStorage', () => {
    writeFormatPreference('advanced');
    expect(readFormatPreference()).toBe('advanced');
    writeFormatPreference(null);
    expect(readFormatPreference()).toBeNull();
  });
});
