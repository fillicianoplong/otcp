import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

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
  type GuestDeckDraft,
  type SavedDeck,
} from '../deckStore';
import { formatDisplayName } from '../format/formatCatalog.ts';
import { useAuth } from '../shared/auth';
import { getSupabaseClient } from '../shared/supabase/client.ts';

const newDeckButtonClassName =
  'inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-md border border-border-strong bg-accent px-4 text-sm font-medium text-on-accent hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

const deckCardClassName =
  'flex min-h-[8.5rem] flex-col justify-between rounded-md border border-border bg-surface p-4';

const deckSecondaryActionClassName =
  'inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:cursor-not-allowed disabled:opacity-50';

const deckCardActionsClassName = 'mt-4 flex flex-wrap gap-2';

function formatDeckUpdatedLabel(updatedAt: string): string {
  const updatedMs = Date.parse(updatedAt);
  if (Number.isNaN(updatedMs)) {
    return 'Updated unknown';
  }

  const diffMs = updatedMs - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (Math.abs(diffDays) >= 1) {
    return `Updated ${rtf.format(diffDays, 'day')}`;
  }

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) >= 1) {
    return `Updated ${rtf.format(diffHours, 'hour')}`;
  }

  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (Math.abs(diffMinutes) >= 1) {
    return `Updated ${rtf.format(diffMinutes, 'minute')}`;
  }

  return 'Updated just now';
}

function guestDeckSummaryLine(draft: GuestDeckDraft): string {
  const main = draft.main.length;
  const extra = draft.extra.length;
  const side = draft.side.length;
  return `Main ${main} · Extra ${extra} · Side ${side} · ${formatDeckUpdatedLabel(draft.updatedAt)} · Local draft`;
}

function savedDeckSummaryLine(deck: SavedDeck): string {
  const main = deck.main.length;
  const extra = deck.extra.length;
  const side = deck.side.length;
  return `Main ${main} · Extra ${extra} · Side ${side} · ${formatDisplayName(deck.formatId)} · ${formatDeckUpdatedLabel(deck.updatedAt)}`;
}

type DeckSignInGatedActionProps = {
  label: string;
  accountPath: string | null;
};

function DeckSignInGatedAction({ label, accountPath }: DeckSignInGatedActionProps) {
  if (accountPath) {
    return (
      <Link to={accountPath} className={deckSecondaryActionClassName}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={deckSecondaryActionClassName}
      disabled
      title="Saving decks to your account is not available yet."
    >
      {label}
    </button>
  );
}

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
        className="relative w-full max-w-md space-y-4 rounded-md border border-border bg-surface p-4 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="text-lg font-semibold text-heading">
          Import local deck {noun}?
        </h2>
        <p className="text-sm text-text">
          You have {draftCount} local deck {noun} from before you signed in. Import{' '}
          {draftCount === 1 ? 'it' : 'them'} to your account so they sync across browsers.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            ref={declineRef}
            type="button"
            className={`${deckSecondaryActionClassName} w-full sm:w-auto`}
            disabled={busy}
            onClick={onDecline}
          >
            Not now
          </button>
          <button
            type="button"
            className={`${newDeckButtonClassName} w-full sm:w-auto`}
            disabled={busy}
            onClick={onImport}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

type GuestDeckCardProps = {
  draft: GuestDeckDraft;
  highlighted: boolean;
  onRename: (id: string) => void;
  onRemove: (id: string) => void;
  onSave: (id: string) => void;
  signedIn: boolean;
  saveBusy: boolean;
};

function GuestDeckCard({
  draft,
  highlighted,
  onRename,
  onRemove,
  onSave,
  signedIn,
  saveBusy,
}: GuestDeckCardProps) {
  const saveAccountPath = deckSaveRequiresAccountPath(signedIn, draft.id);
  const shareAccountPath = deckShareRequiresAccountPath(signedIn, draft.id);

  return (
    <article
      className={`${deckCardClassName}${highlighted ? ' ring-2 ring-border-strong' : ''}`}
      aria-labelledby={`deck-name-${draft.id}`}
    >
      <div className="space-y-1">
        <h2 id={`deck-name-${draft.id}`} className="text-lg font-semibold text-heading">
          {draft.name}
        </h2>
        <p className="text-sm text-text">{guestDeckSummaryLine(draft)}</p>
      </div>
      <div className={deckCardActionsClassName}>
        {signedIn ? (
          <button
            type="button"
            className={deckSecondaryActionClassName}
            disabled={saveBusy}
            onClick={() => onSave(draft.id)}
          >
            Save
          </button>
        ) : (
          <DeckSignInGatedAction label="Save" accountPath={saveAccountPath} />
        )}
        <DeckSignInGatedAction label="Share" accountPath={shareAccountPath} />
        <button
          type="button"
          className={deckSecondaryActionClassName}
          onClick={() => onRename(draft.id)}
        >
          Rename
        </button>
        <button
          type="button"
          className={deckSecondaryActionClassName}
          onClick={() => onRemove(draft.id)}
        >
          Remove
        </button>
      </div>
    </article>
  );
}

type SavedDeckCardProps = {
  deck: SavedDeck;
  onOpen: (id: string) => void;
  onRename: (id: string) => void;
  onRemove: (id: string) => void;
  openBusy: boolean;
};

function SavedDeckCard({ deck, onOpen, onRename, onRemove, openBusy }: SavedDeckCardProps) {
  return (
    <article className={deckCardClassName} aria-labelledby={`saved-deck-name-${deck.id}`}>
      <div className="space-y-1">
        <h2 id={`saved-deck-name-${deck.id}`} className="text-lg font-semibold text-heading">
          {deck.name}
        </h2>
        <p className="text-sm text-text">{savedDeckSummaryLine(deck)}</p>
      </div>
      <div className={deckCardActionsClassName}>
        <button
          type="button"
          className={deckSecondaryActionClassName}
          disabled={openBusy}
          onClick={() => onOpen(deck.id)}
        >
          Open
        </button>
        <button
          type="button"
          className={deckSecondaryActionClassName}
          disabled
          title="Share links are not available yet."
        >
          Share
        </button>
        <button
          type="button"
          className={deckSecondaryActionClassName}
          onClick={() => onRename(deck.id)}
        >
          Rename
        </button>
        <button
          type="button"
          className={deckSecondaryActionClassName}
          onClick={() => onRemove(deck.id)}
        >
          Remove
        </button>
      </div>
    </article>
  );
}

export function DecksPage() {
  const { session, loading } = useAuth();
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
    <div className="space-y-6">
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
        <h1 className="text-2xl font-semibold text-heading">My decks</h1>
        <button type="button" className={newDeckButtonClassName} onClick={handleNewDraft}>
          New deck
        </button>
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
          <h2 id="saved-decks-heading" className="text-lg font-semibold text-heading">
            Saved to your account
          </h2>
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
                  <SavedDeckCard
                    deck={deck}
                    openBusy={openBusyId === deck.id}
                    onOpen={(id) => {
                      void handleSavedOpen(id);
                    }}
                    onRename={(id) => {
                      void handleSavedRename(id);
                    }}
                    onRemove={(id) => {
                      void handleSavedRemove(id);
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
          <h2 id="local-drafts-heading" className="text-lg font-semibold text-heading">
            {signedIn ? 'Local drafts' : 'Deck drafts'}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <GuestDeckCard
                  draft={draft}
                  highlighted={highlightedDraftId === draft.id}
                  signedIn={signedIn}
                  saveBusy={saveBusyId === draft.id}
                  onRename={handleGuestRename}
                  onRemove={handleGuestRemove}
                  onSave={(id) => {
                    void handleGuestSave(id);
                  }}
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
    </div>
  );
}
