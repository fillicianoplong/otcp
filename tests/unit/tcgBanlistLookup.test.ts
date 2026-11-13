import { describe, expect, it } from 'vitest';

import {
  isKnownTcgDatedBanlistDate,
  resolveTcgDatedBanStatus,
} from '../../src/format/tcgBanlistLookup.ts';

describe('tcgBanlistLookup', () => {
  it('maps generated lookup rows to display ban statuses', () => {
    expect(isKnownTcgDatedBanlistDate('2026-02-02')).toBe(true);
    expect(resolveTcgDatedBanStatus('2026-02-02', 440556)).toBe('Forbidden');
  });

  it('returns null for unlimited cards and unknown dates', () => {
    expect(resolveTcgDatedBanStatus('2026-02-02', 1)).toBeNull();
    expect(resolveTcgDatedBanStatus('1900-01-01', 440556)).toBeNull();
  });
});
