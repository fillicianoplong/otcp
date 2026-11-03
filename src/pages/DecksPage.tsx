import { useCallback, useState } from 'react';
import { Link } from 'react-router';

import {
  createGuestDeckDraft,
  deckSaveRequiresAccountPath,
  deckShareRequiresAccountPath,
  listGuestDeckDrafts,
  removeGuestDeckDraft,
  updateGuestDeckDraft,
  type GuestDeckDraft,
} from '../deckStore';
import { useAuth } from '../shared/auth';

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

function deckSummaryLine(draft: GuestDeckDraft): string {
  const main = draft.main.length;
  const extra = draft.extra.length;
  const side = draft.side.length;
  return `Main ${main} · Extra ${extra} · Side ${side} · ${formatDeckUpdatedLabel(draft.updatedAt)}`;
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

type GuestDeckCardProps = {
  draft: GuestDeckDraft;
  onRename: (id: string) => void;
  onRemove: (id: string) => void;
  signedIn: boolean;
};

function GuestDeckCard({ draft, onRename, onRemove, signedIn }: GuestDeckCardProps) {
  const saveAccountPath = deckSaveRequiresAccountPath(signedIn, draft.id);
  const shareAccountPath = deckShareRequiresAccountPath(signedIn, draft.id);

  return (
    <article className={deckCardClassName} aria-labelledby={`deck-name-${draft.id}`}>
      <div className="space-y-1">
        <h2 id={`deck-name-${draft.id}`} className="text-lg font-semibold text-heading">
          {draft.name}
        </h2>
        <p className="text-sm text-text">{deckSummaryLine(draft)}</p>
      </div>
      <div className={deckCardActionsClassName}>
        <DeckSignInGatedAction label="Save" accountPath={saveAccountPath} />
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

export function DecksPage() {
  const { session, loading } = useAuth();
  const signedIn = Boolean(session);
  const [drafts, setDrafts] = useState(() => listGuestDeckDrafts());

  const refreshDrafts = useCallback(() => {
    setDrafts(listGuestDeckDrafts());
  }, []);

  const handleNewDraft = () => {
    createGuestDeckDraft();
    refreshDrafts();
  };

  const handleRename = (id: string) => {
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

  const handleRemove = (id: string) => {
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

  return (
    <div className="space-y-6">
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

      {drafts.length === 0 ? (
        <p
          className="rounded-md border border-border bg-surface p-4 text-base text-text"
          role="status"
        >
          No deck drafts yet. Create one with New deck — it will stay here after you reload the
          page.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <GuestDeckCard
                draft={draft}
                signedIn={signedIn}
                onRename={handleRename}
                onRemove={handleRemove}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
