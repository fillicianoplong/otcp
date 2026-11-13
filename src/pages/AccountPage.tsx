import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { clearLocalAccountData } from '../shared/accountLocalData.ts';
import {
  deleteMyAccount,
  parseSafeInAppReturnTo,
  signIn,
  signOut,
  signUp,
  useAuth,
} from '../shared/auth';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { PageContainer } from '../ui/PageContainer.tsx';
import { PageTitle } from '../ui/PageTitle.tsx';
import { SectionHeader } from '../ui/SectionHeader.tsx';

type AuthMode = 'sign-in' | 'sign-up';

const accountHeaderClassName = 'space-y-2 md:text-center';

const accountCardClassName = 'w-full space-y-4 rounded-md border border-border bg-surface p-4';

const DELETE_CONFIRM_TEXT = 'DELETE';

function AccountPageShell({ children }: { children: ReactNode }) {
  return (
    <PageContainer width="form" className="space-y-6 md:pt-[13vh]">
      {children}
    </PageContainer>
  );
}

function AccountHeading({ subtitle }: { subtitle?: ReactNode }) {
  return (
    <header className={accountHeaderClassName}>
      <PageTitle>Account</PageTitle>
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
        className={`${accountCardClassName} relative max-w-form shadow-lg`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <SectionHeader id={titleId} size="section">
          Delete account
        </SectionHeader>
        <p className="text-sm text-text">
          This permanently deletes your account, saved decks, want lists, collection, and share
          links. Type {DELETE_CONFIRM_TEXT} to confirm.
        </p>
        <label htmlFor={confirmFieldId} className="flex flex-col gap-2 text-sm text-heading">
          Confirmation
          <Input
            id={confirmFieldId}
            type="text"
            autoComplete="off"
            value={confirmText}
            disabled={busy}
            onChange={(event) => onConfirmTextChange(event.target.value)}
          />
        </label>
        {errorMessage ? (
          <p className="text-sm text-ban-forbidden" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            ref={cancelButtonRef}
            className="w-full sm:w-auto"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="w-full sm:w-auto"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            Delete account
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AccountPage() {
  const formId = useId();
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = parseSafeInAppReturnTo(searchParams.get('returnTo'));
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

  useEffect(() => {
    if (loading || !session || !returnTo) {
      return;
    }
    navigate(returnTo, { replace: true });
  }, [loading, navigate, returnTo, session]);

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
          <SectionHeader id={`${formId}-signed-in-heading`} visuallyHidden>
            Signed in
          </SectionHeader>
          <p className="text-base text-text">Signed in as {userEmail}</p>
          <Button
            fullWidth
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
          </Button>
          <Button
            variant="danger"
            fullWidth
            disabled={busy}
            onClick={() => {
              setDeleteConfirmText('');
              setDeleteErrorMessage(null);
              setShowDeleteDialog(true);
            }}
          >
            Delete account
          </Button>
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
        <SectionHeader id={`${formId}-heading`} visuallyHidden>
          {mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </SectionHeader>

        <div className="flex gap-2">
          <Button
            className={`flex-1 ${mode === 'sign-in' ? 'border-border-strong font-semibold' : ''}`}
            aria-pressed={mode === 'sign-in'}
            onClick={() => {
              setMode('sign-in');
              setSignUpNotice(false);
              setErrorMessage(null);
            }}
          >
            Sign in
          </Button>
          <Button
            className={`flex-1 ${mode === 'sign-up' ? 'border-border-strong font-semibold' : ''}`}
            aria-pressed={mode === 'sign-up'}
            onClick={() => {
              setMode('sign-up');
              setSignUpNotice(false);
              setErrorMessage(null);
            }}
          >
            Create account
          </Button>
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
            <Input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label htmlFor={passwordId} className="flex flex-col gap-2 text-sm text-heading">
            Password
            <Input
              id={passwordId}
              name="password"
              type="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              disabled={busy}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {errorMessage ? (
            <p className="text-sm text-heading" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" variant="primary" fullWidth disabled={busy}>
            {submitLabel}
          </Button>
        </form>
      </section>
    </AccountPageShell>
  );
}
