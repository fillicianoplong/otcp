import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTheme, setTheme } from './theme';

describe('theme', () => {
  let root: {
    attributes: Map<string, string>;
    getAttribute(name: string): string | null;
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
    hasAttribute(name: string): boolean;
  };

  beforeEach(() => {
    root = {
      attributes: new Map(),
      getAttribute(name) {
        return this.attributes.get(name) ?? null;
      },
      setAttribute(name, value) {
        this.attributes.set(name, value);
      },
      removeAttribute(name) {
        this.attributes.delete(name);
      },
      hasAttribute(name) {
        return this.attributes.has(name);
      },
    };
    vi.stubGlobal('document', { documentElement: root });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns system when data-theme is absent', () => {
    expect(getTheme()).toBe('system');
  });

  it('returns light or dark when data-theme is set', () => {
    root.setAttribute('data-theme', 'light');
    expect(getTheme()).toBe('light');

    root.setAttribute('data-theme', 'dark');
    expect(getTheme()).toBe('dark');
  });

  it('treats unknown data-theme values as system', () => {
    root.setAttribute('data-theme', 'sepia');
    expect(getTheme()).toBe('system');
  });

  it('sets data-theme for light and dark', () => {
    setTheme('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');

    setTheme('light');
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('removes data-theme for system (match OS)', () => {
    root.setAttribute('data-theme', 'dark');
    setTheme('system');
    expect(root.hasAttribute('data-theme')).toBe(false);
  });

  it('rejects unknown theme values', () => {
    expect(() => setTheme('neon' as 'light')).toThrow(RangeError);
  });
});
