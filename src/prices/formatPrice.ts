const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eurFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export type StorePriceCurrency = 'USD' | 'EUR';

export function formatStorePrice(value: number | undefined, currency: StorePriceCurrency): string {
  if (value === undefined) return '—';
  const formatter = currency === 'EUR' ? eurFormatter : usdFormatter;
  return formatter.format(value);
}

export function formatPriceSnapshotDate(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return isoDateTime;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date);
}
