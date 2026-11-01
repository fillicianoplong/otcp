import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';

import { cardDetailImageFallback, cardDetailImageSrc } from '../catalog/cardArtUrl.ts';
import { PriceView } from '../components/PriceView.tsx';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

function CardDetailArt({ card }: { card: YugiohCard }) {
  const [src, setSrc] = useState(() => cardDetailImageSrc(card));

  return (
    <img
      src={src}
      alt={card.name}
      onError={() => {
        const fallback = cardDetailImageFallback(card, src);
        if (fallback) setSrc(fallback);
      }}
      className="mx-auto w-full max-w-[280px] rounded-md bg-surface-2 object-cover shadow-sm sm:max-w-none"
    />
  );
}

function DetailMessage({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-6 text-text" role="status">
      <h1 className="text-xl font-semibold text-heading">{title}</h1>
      <p className="mt-2 text-sm text-text-2">{children}</p>
    </div>
  );
}

export function CardDetailPage() {
  const { id: idParam } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useCardCatalog();

  const cardId = Number.parseInt(idParam ?? '', 10);
  const searchQuery = searchParams.get('q');
  const backHref =
    searchQuery && searchQuery.length > 0
      ? `/search?q=${encodeURIComponent(searchQuery)}`
      : '/search';

  if (state.status === 'loading') {
    return (
      <DetailMessage title="Loading card…">
        Fetching the published catalog to show this card.
      </DetailMessage>
    );
  }

  if (state.status === 'empty' || state.status === 'error') {
    return (
      <DetailMessage title="Card unavailable">
        {state.status === 'error' ? state.message : 'The catalog has no cards to show right now.'}
      </DetailMessage>
    );
  }

  if (!Number.isFinite(cardId)) {
    return (
      <DetailMessage title="Invalid card link">
        This URL does not include a valid card passcode.
      </DetailMessage>
    );
  }

  const card = state.cards.find((entry) => entry.id === cardId);
  if (!card) {
    return (
      <div className="flex flex-col gap-4">
        <DetailMessage title="Card not found">
          No card in the published dataset matches that passcode.
        </DetailMessage>
        <Link
          to={backHref}
          className="text-sm font-medium text-heading underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={backHref}
        className="w-fit text-sm font-medium text-heading underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
      >
        ← Back to Search
      </Link>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="shrink-0 sm:w-[min(100%,280px)]">
          <CardDetailArt card={card} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-6 sm:max-w-xl">
          <header>
            <h1 className="text-2xl font-semibold text-heading">{card.name}</h1>
            <p className="mt-1 text-sm text-text-2">{card.type}</p>
          </header>
          <PriceView prices={card.prices} snapshotAt={state.generatedAt} />
        </div>
      </div>
    </div>
  );
}
