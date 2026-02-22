import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  datasetFileToRepoRelative,
  resolveDatasetRepoPath,
  siteRelativeDatasetFile,
} from '../../pipeline/pointer.ts';

describe('pointer dataset paths', () => {
  it('writes site-root-relative datasetFile paths', () => {
    expect(siteRelativeDatasetFile('cards-2026-11-01T12-00-00Z.json')).toBe(
      'data/datasets/cards-2026-11-01T12-00-00Z.json',
    );
  });

  it('maps site-root paths back to public/data in the repo', () => {
    expect(datasetFileToRepoRelative('data/datasets/sample-dev.json')).toBe(
      'public/data/datasets/sample-dev.json',
    );
  });

  it('accepts legacy public/ prefixes in stored pointers', () => {
    expect(datasetFileToRepoRelative('public/data/datasets/sample-dev.json')).toBe(
      'public/data/datasets/sample-dev.json',
    );
  });

  it('resolves repo paths from either pointer format', () => {
    const root = '/repo';
    expect(resolveDatasetRepoPath(root, 'data/datasets/cards.json')).toBe(
      join(root, 'public/data/datasets/cards.json'),
    );
    expect(resolveDatasetRepoPath(root, 'public/data/datasets/cards.json')).toBe(
      join(root, 'public/data/datasets/cards.json'),
    );
  });
});
