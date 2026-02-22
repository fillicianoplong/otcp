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
      className="inline-flex min-h-[var(--touch-min)] items-center gap-1 text-sm font-medium text-heading underline decoration-border underline-offset-2 transition-colors hover:decoration-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
    >
      {label}
      <span aria-hidden="true" className="text-xs text-text-2">
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
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 text-sm">
        {STORE_ROWS.map(({ label, key, currency }) => (
          <div key={key} className="contents">
            <dt className="text-text-2">{label}</dt>
            <dd className="text-right font-medium tabular-nums text-heading">
              {formatStorePrice(prices?.[key], currency)}
            </dd>
            <dd className="col-start-2 flex justify-end pb-2 last:pb-0">
              <StoreOutboundLink store={key} cardName={cardName} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-text-2">as of {formatPriceSnapshotDate(snapshotAt)}</p>
    </section>
  );
}
