import { describe, expect, it } from 'vitest';

import { formatOptionMatchesQuery } from '../../src/format/formatFilterSearch.ts';

describe('format filter search', () => {
  it('matches display name and format id', () => {
    expect(formatOptionMatchesQuery({ id: 'goat', name: 'GOAT' }, 'goat')).toBe(true);
    expect(formatOptionMatchesQuery({ id: 'goat', name: 'GOAT' }, 'go')).toBe(true);
    expect(formatOptionMatchesQuery({ id: 'hypernova', name: 'Hypernova' }, 'hyper')).toBe(true);
    expect(formatOptionMatchesQuery({ id: 'goat', name: 'GOAT' }, 'edison')).toBe(false);
  });

  it('matches None when typing none', () => {
    expect(formatOptionMatchesQuery({ id: null, name: 'None' }, 'no')).toBe(true);
  });
});
