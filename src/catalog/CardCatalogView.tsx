import { useState, type ReactNode } from 'react';

import type { YugiohCard } from '../shared/schema/card.ts';
import { useCardCatalog } from './useCardCatalog.ts';

function CardArt({ card }: { card: YugiohCard }) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <div
        className="flex aspect-[59/86] w-full items-center justify-center rounded-sm bg-surface-2 text-xs text-text-2"
        aria-hidden
      >
        No image
      </div>
    );
  }

  return (
    <img
      src={card.images.small}
      alt={card.name}
      loading="lazy"
      decoding="async"
      onError={() => setMissing(true)}
      className="aspect-[59/86] w-full rounded-sm bg-surface-2 object-cover"
    />
  );
}

function CardTile({ card }: { card: YugiohCard }) {
  return (
    <li className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3 shadow-sm">
      <CardArt card={card} />
      <p className="text-sm font-medium text-heading">{card.name}</p>
    </li>
  );
}

function CatalogMessage({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-6 text-text" role="status">
      <h2 className="text-base font-semibold text-heading">{title}</h2>
      <p className="mt-2 text-sm text-text-2">{children}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function CardCatalogView({ headingId }: { headingId?: string }) {
  const { state, retry } = useCardCatalog();

  if (state.status === 'loading') {
    return (
      <CatalogMessage title="Loading cards…">
        Fetching the published catalog index and card data.
      </CatalogMessage>
    );
  }

  if (state.status === 'empty') {
    return (
      <CatalogMessage title="No cards yet">
        The catalog index is missing or the published dataset has zero cards.
      </CatalogMessage>
    );
  }

  if (state.status === 'error') {
    return (
      <CatalogMessage
        title="Could not load cards"
        action={
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-[var(--touch-min)] items-center rounded-md border border-border-strong bg-accent px-4 text-sm font-medium text-on-accent hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
          >
            Retry
          </button>
        }
      >
        {state.message}
      </CatalogMessage>
    );
  }

  return (
    <section aria-labelledby={headingId}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {state.cards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </ul>
    </section>
  );
}
