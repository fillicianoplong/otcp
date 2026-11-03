import { useId, useState, type ReactNode } from 'react';

import { signIn, signOut, signUp, useAuth } from '../shared/auth';

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
          {errorMessage ? (
            <p className="text-sm text-heading" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </section>
      </AccountPageShell>
    );
  }

  const submitLabel = mode === 'sign-in' ? 'Sign in' : 'Create account';

  return (
    <AccountPageShell>
      <AccountHeading
        subtitle={
          <p className="text-base text-text">
            {mode === 'sign-in'
              ? 'Sign in with your email and password.'
              : 'Create an account with your email and password.'}
          </p>
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
