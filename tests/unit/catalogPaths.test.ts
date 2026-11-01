import { describe, expect, it } from 'vitest';

import { publicDataUrl } from '../../src/catalog/paths.ts';

describe('publicDataUrl', () => {
  it('maps site-root dataset paths under the Vite base', () => {
    const url = publicDataUrl('data/datasets/sample-dev.json');
    expect(url).toMatch(/data\/datasets\/sample-dev\.json$/);
    expect(url).toBe(`${import.meta.env.BASE_URL}data/datasets/sample-dev.json`);
  });

  it('strips a legacy public/ prefix before joining the base', () => {
    expect(publicDataUrl('public/data/datasets/sample-dev.json')).toBe(
      publicDataUrl('data/datasets/sample-dev.json'),
    );
  });

  it('resolves the current pointer path', () => {
    expect(publicDataUrl('data/current.json')).toBe(`${import.meta.env.BASE_URL}data/current.json`);
  });
});
