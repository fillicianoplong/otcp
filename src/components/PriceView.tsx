import type { CardPrices } from '../shared/schema/core.ts';
import { formatPriceSnapshotDate, formatStorePrice } from '../prices/formatPrice.ts';

const STORE_ROWS = [
  { label: 'TCGplayer', key: 'tcgplayer' as const, currency: 'USD' as const },
  { label: 'CoolStuffInc', key: 'coolstuffinc' as const, currency: 'USD' as const },
  { label: 'Cardmarket', key: 'cardmarket' as const, currency: 'EUR' as const },
];

export function PriceView({ prices, snapshotAt }: { prices?: CardPrices; snapshotAt: string }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="card-prices-heading">
      <h2 id="card-prices-heading" className="text-base font-semibold text-heading">
        Prices
      </h2>
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-sm">
        {STORE_ROWS.map(({ label, key, currency }) => (
          <div key={key} className="contents">
            <dt className="text-text-2">{label}</dt>
            <dd className="text-right font-medium tabular-nums text-heading">
              {formatStorePrice(prices?.[key], currency)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-text-2">as of {formatPriceSnapshotDate(snapshotAt)}</p>
    </section>
  );
}
