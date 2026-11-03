import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { clearLocalAccountData } from '../shared/accountLocalData.ts';
import { deleteMyAccount, signIn, signOut, signUp, useAuth } from '../shared/auth';

type AuthMode = 'sign-in' | 'sign-up';

const accountPageShellClassName = 'w-full space-y-6 md:mx-auto md:max-w-md md:pt-[13vh]';

const accountHeaderClassName = 'space-y-2 md:text-center';

const accountCardClassName = 'w-full space-y-4 rounded-md border border-border bg-surface p-4';

const inputClassName =
  'min-h-[var(--touch-min)] w-full rounded-md border border-border bg-surface px-3 text-base text-text placeholder:text-text-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

const primaryButtonClassName =
  'inline-flex min-h-[var(--touch-min)] w-full items-center justify-center rounded-md border border-border-strong bg-accent px-4 text-sm font-medium text-on-accent hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButtonClassName =
  'inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:cursor-not-allowed disabled:opacity-50';

const dangerButtonClassName =
  'inline-flex min-h-[var(--touch-min)] w-full items-center justify-center rounded-md border border-ban-forbidden bg-surface px-4 text-sm font-medium text-ban-forbidden hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:cursor-not-allowed disabled:opacity-50';

const DELETE_CONFIRM_TEXT = 'DELETE';

function AccountPageShell({ children }: { children: ReactNode }) {
  return <div className={accountPageShellClassName}>{children}</div>;
}

function AccountHeading({ subtitle }: { subtitle?: ReactNode }) {
  return (
    <header className={accountHeaderClassName}>
      <h1 className="text-2xl font-semibold text-heading">Account</h1>
      {subtitle}
    </header>
  );
}

type DeleteAccountDialogProps = {
  open: boolean;
  busy: boolean;
  confirmText: string;
  errorMessage: string | null;
  onConfirmTextChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteAccountDialog({
  open,
  busy,
  confirmText,
  errorMessage,
  onConfirmTextChange,
  onCancel,
  onConfirm,
}: DeleteAccountDialogProps) {
  const titleId = useId();
  const confirmFieldId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const canConfirm = confirmText === DELETE_CONFIRM_TEXT && !busy;

  useEffect(() => {
    if (!open) {
      return;
    }
    cancelButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        onCancel();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4"
      role="presentation"
    >
      <div
        className={`${accountCardClassName} relative max-w-md shadow-lg`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="text-lg font-semibold text-heading">
          Delete account
        </h2>
        <p className="text-sm text-text">
          This permanently deletes your account, saved decks, want lists, collection, and share
          links. Type {DELETE_CONFIRM_TEXT} to confirm.
        </p>
        <label htmlFor={confirmFieldId} className="flex flex-col gap-2 text-sm text-heading">
          Confirmation
          <input
            id={confirmFieldId}
            type="text"
            autoComplete="off"
            value={confirmText}
            disabled={busy}
            onChange={(event) => onConfirmTextChange(event.target.value)}
            className={inputClassName}
          />
        </label>
        {errorMessage ? (
          <p className="text-sm text-ban-forbidden" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            className={`${secondaryButtonClassName} w-full sm:w-auto`}
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${dangerButtonClassName} sm:w-auto`}
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccountPage() {
  const formId = useId();
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const { configured, loading, session, userEmail } = useAuth();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signUpNotice, setSignUpNotice] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [accountDeletedNotice, setAccountDeletedNotice] = useState(false);

  if (!configured) {
    return (
      <AccountPageShell>
        <AccountHeading
          subtitle={
            <p className="text-base text-text" role="status">
              Accounts are not available on this site yet.
            </p>
          }
        />
      </AccountPageShell>
    );
  }

  if (loading) {
    return (
      <AccountPageShell>
        <AccountHeading
          subtitle={
            <p className="text-base text-text" role="status">
              Loading…
            </p>
          }
        />
      </AccountPageShell>
    );
  }

  if (session && userEmail) {
    return (
      <AccountPageShell>
        <AccountHeading />
        <section className={accountCardClassName} aria-labelledby={`${formId}-signed-in-heading`}>
          <h2 id={`${formId}-signed-in-heading`} className="sr-only">
            Signed in
          </h2>
          <p className="text-base text-text">Signed in as {userEmail}</p>
          <button
            type="button"
            className={`${secondaryButtonClassName} w-full`}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setErrorMessage(null);
              void signOut().then((result) => {
                setBusy(false);
                if (!result.ok) {
                  setErrorMessage(result.message);
                }
              });
            }}
          >
            Sign out
          </button>
          <button
            type="button"
            className={dangerButtonClassName}
            disabled={busy}
            onClick={() => {
              setDeleteConfirmText('');
              setDeleteErrorMessage(null);
              setShowDeleteDialog(true);
            }}
          >
            Delete account
          </button>
          {errorMessage ? (
            <p className="text-sm text-heading" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </section>
        <DeleteAccountDialog
          open={showDeleteDialog}
          busy={busy}
          confirmText={deleteConfirmText}
          errorMessage={deleteErrorMessage}
          onConfirmTextChange={setDeleteConfirmText}
          onCancel={() => {
            if (busy) {
              return;
            }
            setShowDeleteDialog(false);
            setDeleteConfirmText('');
            setDeleteErrorMessage(null);
          }}
          onConfirm={() => {
            const userId = session.user.id;
            setBusy(true);
            setDeleteErrorMessage(null);
            void deleteMyAccount().then((result) => {
              if (!result.ok) {
                setBusy(false);
                setDeleteErrorMessage(result.message);
                return;
              }
              clearLocalAccountData(userId);
              void signOut().then((signOutResult) => {
                setBusy(false);
                setShowDeleteDialog(false);
                setDeleteConfirmText('');
                if (!signOutResult.ok) {
                  setDeleteErrorMessage(signOutResult.message);
                  return;
                }
                setAccountDeletedNotice(true);
              });
            });
          }}
        />
      </AccountPageShell>
    );
  }

  const submitLabel = mode === 'sign-in' ? 'Sign in' : 'Create account';

  return (
    <AccountPageShell>
      <AccountHeading
        subtitle={
          accountDeletedNotice ? (
            <p className="text-base text-text" role="status">
              Your account has been deleted.
            </p>
          ) : (
            <p className="text-base text-text">
              {mode === 'sign-in'
                ? 'Sign in with your email and password.'
                : 'Create an account with your email and password.'}
            </p>
          )
        }
      />

      <section className={accountCardClassName} aria-labelledby={`${formId}-heading`}>
        <h2 id={`${formId}-heading`} className="sr-only">
          {mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </h2>

        <div className="flex gap-2">
          <button
            type="button"
            className={`${secondaryButtonClassName} flex-1 ${mode === 'sign-in' ? 'border-border-strong font-semibold' : ''}`}
            aria-pressed={mode === 'sign-in'}
            onClick={() => {
              setMode('sign-in');
              setSignUpNotice(false);
              setErrorMessage(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`${secondaryButtonClassName} flex-1 ${mode === 'sign-up' ? 'border-border-strong font-semibold' : ''}`}
            aria-pressed={mode === 'sign-up'}
            onClick={() => {
              setMode('sign-up');
              setSignUpNotice(false);
              setErrorMessage(null);
            }}
          >
            Create account
          </button>
        </div>

        {signUpNotice ? (
          <p className="text-sm text-text" role="status">
            Check your email to confirm your account.
          </p>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setBusy(true);
            setErrorMessage(null);
            setSignUpNotice(false);

            const action = mode === 'sign-in' ? signIn : signUp;
            void action(email, password).then((result) => {
              setBusy(false);
              if (!result.ok) {
                setErrorMessage(result.message);
                return;
              }
              if (result.needsEmailConfirmation) {
                setSignUpNotice(true);
              }
            });
          }}
        >
          <label htmlFor={emailId} className="flex flex-col gap-2 text-sm text-heading">
            Email
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
            />
          </label>

          <label htmlFor={passwordId} className="flex flex-col gap-2 text-sm text-heading">
            Password
            <input
              id={passwordId}
              name="password"
              type="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              disabled={busy}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
            />
          </label>

          {errorMessage ? (
            <p className="text-sm text-heading" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button type="submit" className={primaryButtonClassName} disabled={busy}>
            {submitLabel}
          </button>
        </form>
      </section>
    </AccountPageShell>
  );
}
