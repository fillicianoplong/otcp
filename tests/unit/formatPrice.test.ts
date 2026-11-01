import { describe, expect, it } from 'vitest';

import { formatPriceSnapshotDate, formatStorePrice } from '../../src/prices/formatPrice.ts';

describe('formatStorePrice', () => {
  it('formats present USD values', () => {
    expect(formatStorePrice(1.23, 'USD')).toBe('$1.23');
  });

  it('formats present EUR values', () => {
    expect(formatStorePrice(0.95, 'EUR')).toBe('€0.95');
  });

  it('shows an em dash when the value is missing', () => {
    expect(formatStorePrice(undefined, 'USD')).toBe('—');
  });

  it('formats zero as a currency amount', () => {
    expect(formatStorePrice(0, 'USD')).toBe('$0.00');
  });
});

describe('formatPriceSnapshotDate', () => {
  it('formats an ISO timestamp for display', () => {
    expect(formatPriceSnapshotDate('2026-10-28T12:00:00.000Z')).toBe('Oct 28, 2026');
  });
});
