/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  readLocalStorageString,
  writeLocalStorageString,
} from '../../src/shared/safeLocalStorage.ts';

describe('safeLocalStorage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reads and writes a string', () => {
    writeLocalStorageString('otcp:test', 'hello');
    expect(readLocalStorageString('otcp:test')).toBe('hello');
    expect(readLocalStorageString('otcp:missing')).toBeNull();
  });

  it('returns null when getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readLocalStorageString('otcp:test')).toBeNull();
  });

  it('does not throw when setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => writeLocalStorageString('otcp:test', 'value')).not.toThrow();
  });
});
