import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import { DeckListCard } from '../deckList/DeckListCard.tsx';
import {
  applyOpenSavedDeck,
  createGuestDeckDraft,
  deckSaveRequiresAccountPath,
  deckShareRequiresAccountPath,
  deleteSavedDeck,
  getGuestDeckDraft,
  guestDraftIdsPendingImport,
  importGuestDraftsToAccount,
  listGuestDeckDrafts,
  listSavedDecks,
  loadSavedDeck,
  markGuestDraftImportsDeclined,
  removeGuestDeckDraft,
  renameSavedDeck,
  saveGuestDraftToAccount,
  shouldOfferGuestDraftImport,
  updateGuestDeckDraft,
  updateSavedDeck,
  type DeckCover,
  type GuestDeckDraft,
  type SavedDeck,
} from '../deckStore';
import { useAuth } from '../shared/auth';
import type { YugiohCard } from '../shared/schema/card.ts';
import { getSupabaseClient } from '../shared/supabase/client.ts';
import { Button } from '../ui/Button.tsx';
import { PageContainer } from '../ui/PageContainer.tsx';
import { PageTitle } from '../ui/PageTitle.tsx';
import { SectionHeader } from '../ui/SectionHeader.tsx';

type GuestDraftImportDialogProps = {
  open: boolean;
  draftCount: number;
  busy: boolean;
  onImport: () => void;
  onDecline: () => void;
};

function GuestDraftImportDialog({
  open,
  draftCount,
  busy,
  onImport,
  onDecline,
}: GuestDraftImportDialogProps) {
  const titleId = useId();
  const declineRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    declineRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        onDecline();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onDecline, open]);

  if (!open) {
    return null;
  }

  const noun = draftCount === 1 ? 'draft' : 'drafts';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4"
      role="presentation"
    >
      <div
        className="relative w-full max-w-form space-y-4 rounded-md border border-border bg-surface p-4 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <SectionHeader id={titleId} size="section">
          Import local deck {noun}?
        </SectionHeader>
        <p className="text-sm text-text">
          You have {draftCount} local deck {noun} from before you signed in. Import{' '}
          {draftCount === 1 ? 'it' : 'them'} to your account so they sync across browsers.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button ref={declineRef} className="w-full sm:w-auto" disabled={busy} onClick={onDecline}>
            Not now
          </Button>
          <Button variant="primary" className="w-full sm:w-auto" disabled={busy} onClick={onImport}>
            Import
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DecksPage() {
  const { session, loading } = useAuth();
  const { state: catalogState } = useCardCatalog();
  const signedIn = Boolean(session);
  const userId = session?.user?.id ?? null;
  const [searchParams] = useSearchParams();
  const highlightedDraftId = searchParams.get('draft');
  const [drafts, setDrafts] = useState(() => listGuestDeckDrafts());
  const [savedDecksCache, setSavedDecksCache] = useState<{
    userId: string;
    decks: SavedDeck[];
  } | null>(null);
  const [saveBusyId, setSaveBusyId] = useState<string | null>(null);
  const [openBusyId, setOpenBusyId] = useState<string | null>(null);
  const [importSuppressedUserId, setImportSuppressedUserId] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const savedDecks =
    signedIn && userId && savedDecksCache?.userId === userId ? savedDecksCache.decks : [];
  const savedLoading = signedIn && userId !== null && savedDecksCache?.userId !== userId;
  const cardsById = useMemo(() => {
    if (catalogState.status !== 'ready') {
      return new Map<number, YugiohCard>();
    }
    return new Map(catalogState.cards.map((card) => [card.id, card]));
  }, [catalogState]);

  const refreshDrafts = useCallback(() => {
    setDrafts(listGuestDeckDrafts());
  }, []);

  const refreshSavedDecks = useCallback(async () => {
    if (!signedIn || !userId) {
      return;
    }
    const result = await listSavedDecks(getSupabaseClient());
    if (result.ok) {
      setSavedDecksCache({ userId, decks: result.decks });
    }
  }, [signedIn, userId]);

  useEffect(() => {
    if (!signedIn || !userId || savedDecksCache?.userId === userId) {
      return;
    }
    let cancelled = false;
    void listSavedDecks(getSupabaseClient()).then((result) => {
      if (cancelled || !result.ok) {
        return;
      }
      setSavedDecksCache({ userId, decks: result.decks });
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn, savedDecksCache?.userId, userId]);

  const pendingImportDrafts = guestDraftIdsPendingImport(drafts.map((draft) => draft.id))
    .map((id) => getGuestDeckDraft(id))
    .filter((draft): draft is GuestDeckDraft => draft !== null);

  const importDialogOpen =
    signedIn &&
    !loading &&
    importSuppressedUserId !== userId &&
    shouldOfferGuestDraftImport({
      signedIn: true,
      guestDraftIds: drafts.map((draft) => draft.id),
    });

  const handleNewDraft = () => {
    createGuestDeckDraft();
    refreshDrafts();
  };

  const handleGuestRename = (id: string) => {
    const draft = drafts.find((entry) => entry.id === id);
    if (!draft) {
      return;
    }
    const nextName = window.prompt('Deck name', draft.name);
    if (nextName === null) {
      return;
    }
    updateGuestDeckDraft(id, { name: nextName });
    refreshDrafts();
  };

  const handleGuestRemove = (id: string) => {
    const draft = drafts.find((entry) => entry.id === id);
    if (!draft) {
      return;
    }
    const confirmed = window.confirm(`Remove “${draft.name}”?`);
    if (!confirmed) {
      return;
    }
    removeGuestDeckDraft(id);
    refreshDrafts();
  };

  const handleGuestChooseCover = (id: string, cover: DeckCover) => {
    updateGuestDeckDraft(id, { cover });
    refreshDrafts();
  };

  const handleSavedChooseCover = async (id: string, cover: DeckCover) => {
    const result = await updateSavedDeck(id, { cover }, getSupabaseClient());
    if (!result.ok) {
      setStatusMessage(result.message);
      return;
    }
    await refreshSavedDecks();
  };

  const handleGuestSave = async (id: string) => {
    const draft = getGuestDeckDraft(id);
    if (!draft) {
      return;
    }
    setSaveBusyId(id);
    setStatusMessage(null);
    const result = await saveGuestDraftToAccount(draft, getSupabaseClient());
    setSaveBusyId(null);
    if (!result.ok) {
      setStatusMessage(result.message);
      return;
    }
    removeGuestDeckDraft(id);
    refreshDrafts();
    await refreshSavedDecks();
    setStatusMessage(`Saved “${draft.name}” to your account.`);
  };

  const handleSavedRename = async (id: string) => {
    const deck = savedDecks.find((entry) => entry.id === id);
    if (!deck) {
      return;
    }
    const nextName = window.prompt('Deck name', deck.name);
    if (nextName === null) {
      return;
    }
    const result = await renameSavedDeck(id, nextName, getSupabaseClient());
    if (!result.ok) {
      setStatusMessage(result.message);
      return;
    }
    await refreshSavedDecks();
  };

  const handleSavedRemove = async (id: string) => {
    const deck = savedDecks.find((entry) => entry.id === id);
    if (!deck) {
      return;
    }
    const confirmed = window.confirm(`Remove “${deck.name}”?`);
    if (!confirmed) {
      return;
    }
    const result = await deleteSavedDeck(id, getSupabaseClient());
    if (!result.ok) {
      setStatusMessage(result.message);
      return;
    }
    await refreshSavedDecks();
  };

  const handleSavedOpen = async (id: string) => {
    setOpenBusyId(id);
    setStatusMessage(null);
    const result = await loadSavedDeck(id, getSupabaseClient());
    setOpenBusyId(null);
    if (!result.ok) {
      setStatusMessage(result.message);
      return;
    }
    applyOpenSavedDeck(result.deck);
    setStatusMessage(`Opened “${result.deck.name}” for editing.`);
  };

  const handleImportDecline = () => {
    if (userId) {
      setImportSuppressedUserId(userId);
    }
    markGuestDraftImportsDeclined(pendingImportDrafts.map((draft) => draft.id));
  };

  const handleImportConfirm = async () => {
    if (pendingImportDrafts.length === 0) {
      return;
    }
    setImportBusy(true);
    setStatusMessage(null);
    const result = await importGuestDraftsToAccount(pendingImportDrafts, getSupabaseClient());
    setImportBusy(false);
    if (!result.ok) {
      setStatusMessage(result.message);
      return;
    }
    if (userId) {
      setImportSuppressedUserId(userId);
    }
    refreshDrafts();
    await refreshSavedDecks();
    setStatusMessage(
      result.savedDeckIds.length === 1
        ? 'Imported 1 deck to your account.'
        : `Imported ${result.savedDeckIds.length} decks to your account.`,
    );
  };

  const showEmptyState =
    !loading && !savedLoading && drafts.length === 0 && (!signedIn || savedDecks.length === 0);

  return (
    <PageContainer className="space-y-6">
      <GuestDraftImportDialog
        open={importDialogOpen}
        draftCount={pendingImportDrafts.length}
        busy={importBusy}
        onImport={() => {
          void handleImportConfirm();
        }}
        onDecline={handleImportDecline}
      />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle>My decks</PageTitle>
        <Button variant="primary" onClick={handleNewDraft}>
          New deck
        </Button>
      </header>

      {loading ? (
        <p className="text-base text-text" role="status">
          Loading account…
        </p>
      ) : null}

      {statusMessage ? (
        <p
          className="rounded-md border border-border bg-surface p-4 text-base text-text"
          role="status"
        >
          {statusMessage}
        </p>
      ) : null}

      {signedIn ? (
        <section className="space-y-3" aria-labelledby="saved-decks-heading">
          <SectionHeader id="saved-decks-heading" size="section">
            Saved to your account
          </SectionHeader>
          {savedLoading ? (
            <p className="text-base text-text" role="status">
              Loading saved decks…
            </p>
          ) : savedDecks.length === 0 ? (
            <p className="rounded-md border border-border bg-surface p-4 text-base text-text">
              No saved decks yet. Save a local draft or import one after sign-in.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedDecks.map((deck) => (
                <li key={deck.id}>
                  <DeckListCard
                    deck={{ ...deck, localDraft: false }}
                    cardsById={cardsById}
                    openBusy={openBusyId === deck.id}
                    shareDisabledTitle="Share links are not available yet."
                    onOpen={() => {
                      void handleSavedOpen(deck.id);
                    }}
                    onRename={() => {
                      void handleSavedRename(deck.id);
                    }}
                    onRemove={() => {
                      void handleSavedRemove(deck.id);
                    }}
                    onChooseCover={(cover) => {
                      void handleSavedChooseCover(deck.id, cover);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {drafts.length > 0 ? (
        <section className="space-y-3" aria-labelledby="local-drafts-heading">
          <SectionHeader id="local-drafts-heading" size="section">
            {signedIn ? 'Local drafts' : 'Deck drafts'}
          </SectionHeader>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <DeckListCard
                  deck={{ ...draft, localDraft: true }}
                  cardsById={cardsById}
                  highlighted={highlightedDraftId === draft.id}
                  openHref={`/decks/edit/${draft.id}`}
                  saveBusy={saveBusyId === draft.id}
                  saveAccountPath={signedIn ? null : deckSaveRequiresAccountPath(false, draft.id)}
                  shareAccountPath={deckShareRequiresAccountPath(signedIn, draft.id)}
                  shareDisabledTitle="Saving decks to your account is not available yet."
                  onSave={
                    signedIn
                      ? () => {
                          void handleGuestSave(draft.id);
                        }
                      : undefined
                  }
                  onRename={() => handleGuestRename(draft.id)}
                  onRemove={() => handleGuestRemove(draft.id)}
                  onChooseCover={(cover) => handleGuestChooseCover(draft.id, cover)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showEmptyState ? (
        <p
          className="rounded-md border border-border bg-surface p-4 text-base text-text"
          role="status"
        >
          No deck drafts yet. Create one with New deck — it will stay here after you reload the
          page.
        </p>
      ) : null}
    </PageContainer>
  );
}
