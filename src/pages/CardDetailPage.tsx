import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';

import { cardDetailImageFallback, cardDetailImageSrc } from '../catalog/cardArtUrl.ts';
import { getCatalogDerived } from '../catalog/catalogDerived.ts';
import { CardImageZoomViewer } from '../components/CardImageZoomViewer.tsx';
import { PriceView } from '../components/PriceView.tsx';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

function CardDetailArt({ card }: { card: YugiohCard }) {
  const [src, setSrc] = useState(() => cardDetailImageSrc(card));
  const [viewerOpen, setViewerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openViewer = () => setViewerOpen(true);
  const closeViewer = () => setViewerOpen(false);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openViewer}
        className="block w-full cursor-zoom-in rounded-md bg-surface-2 p-0 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        aria-label={`View larger artwork for ${card.name}`}
      >
        <img
          src={src}
          alt={card.name}
          onError={() => {
            const fallback = cardDetailImageFallback(card, src);
            if (fallback) setSrc(fallback);
          }}
          className="pointer-events-none mx-auto w-full max-w-full rounded-md object-contain sm:max-w-[435px]"
        />
      </button>
      {viewerOpen ? (
        <CardImageZoomViewer
          src={src}
          alt={card.name}
          onClose={closeViewer}
          triggerRef={triggerRef}
        />
      ) : null}
    </>
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

const backLinkClassName =
  'w-fit text-sm font-medium text-heading underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

function BackToSearchControl({ searchQuery }: { searchQuery: string | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fromSearch = (location.state as { fromSearch?: boolean } | null)?.fromSearch === true;

  if (fromSearch) {
    return (
      <button type="button" onClick={() => navigate(-1)} className={backLinkClassName}>
        ← Back to Search
      </button>
    );
  }

  const backHref =
    searchQuery && searchQuery.length > 0
      ? `/search?q=${encodeURIComponent(searchQuery)}`
      : '/search';

  return (
    <Link to={backHref} className={backLinkClassName}>
      ← Back to Search
    </Link>
  );
}

export function CardDetailPage() {
  const { id: idParam } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useCardCatalog();

  const cardId = Number.parseInt(idParam ?? '', 10);
  const searchQuery = searchParams.get('q');

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

  const card = getCatalogDerived(state.cards).cardById.get(cardId);
  if (!card) {
    return (
      <div className="flex flex-col gap-4">
        <DetailMessage title="Card not found">
          No card in the published dataset matches that passcode.
        </DetailMessage>
        <BackToSearchControl searchQuery={searchQuery} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackToSearchControl searchQuery={searchQuery} />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="w-full shrink-0 sm:max-w-[435px]">
          <CardDetailArt card={card} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-6 sm:max-w-xl">
          <header>
            <h1 className="text-2xl font-semibold text-heading">{card.name}</h1>
            <p className="mt-1 text-sm text-text-2">{card.type}</p>
          </header>
          <PriceView cardName={card.name} prices={card.prices} snapshotAt={state.generatedAt} />
        </div>
      </div>
    </div>
  );
}
