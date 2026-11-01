import type { CardPrices } from '../shared/schema/core.ts';
import { formatPriceSnapshotDate, formatStorePrice } from '../prices/formatPrice.ts';
import { buildStoreSearchUrl, STORE_LINK_LABELS, type StoreKey } from '../prices/storeLinks.ts';

const STORE_ROWS: {
  label: string;
  key: StoreKey;
  currency: 'USD' | 'EUR';
}[] = [
  { label: 'TCGplayer', key: 'tcgplayer', currency: 'USD' },
  { label: 'CoolStuffInc', key: 'coolstuffinc', currency: 'USD' },
  { label: 'Cardmarket', key: 'cardmarket', currency: 'EUR' },
];

function StoreOutboundLink({ store, cardName }: { store: StoreKey; cardName: string }) {
  const href = buildStoreSearchUrl(store, cardName);
  const label = STORE_LINK_LABELS[store];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex min-h-[var(--touch-min)] min-w-[var(--touch-min)] shrink-0 items-center justify-center rounded-sm text-heading transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
    >
      <span aria-hidden="true" className="text-sm leading-none">
        ↗
      </span>
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  );
}

export function PriceView({
  cardName,
  prices,
  snapshotAt,
}: {
  cardName: string;
  prices?: CardPrices;
  snapshotAt: string;
}) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="card-prices-heading">
      <h2 id="card-prices-heading" className="text-base font-semibold text-heading">
        Prices
      </h2>
      <dl className="flex flex-col gap-2 text-sm">
        {STORE_ROWS.map(({ label, key, currency }) => (
          <div key={key} className="flex min-w-0 items-center gap-3">
            <dt className="min-w-0 flex-1 truncate text-text-2">{label}</dt>
            <dd className="shrink-0 font-medium tabular-nums text-heading">
              {formatStorePrice(prices?.[key], currency)}
            </dd>
            <dd className="shrink-0">
              <StoreOutboundLink store={key} cardName={cardName} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-text-2">as of {formatPriceSnapshotDate(snapshotAt)}</p>
    </section>
  );
}
