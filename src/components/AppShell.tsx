import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { PRIMARY_NAV } from '../nav';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'inline-flex min-h-[var(--touch-min)] items-center px-3 text-base text-text transition-colors',
    'hover:text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong',
    isActive
      ? 'font-semibold text-heading underline decoration-border-strong underline-offset-4'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

type NavLinksProps = {
  id?: string;
  className?: string;
  listClassName?: string;
  onNavigate?: () => void;
};

function NavLinks({ id, className, listClassName, onNavigate }: NavLinksProps) {
  return (
    <nav id={id} className={className} aria-label="Primary">
      <ul className={listClassName ?? 'flex flex-wrap gap-1'}>
        {PRIMARY_NAV.map(({ label, to }) => (
          <li key={to}>
            <NavLink to={to} className={navLinkClass} onClick={onNavigate}>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerId = useId().replace(/:/g, '');

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-heading focus:shadow-[0_0_0_2px_var(--color-border-strong)]"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-md border border-border bg-surface-2 text-heading md:hidden"
            aria-expanded={menuOpen}
            aria-controls={drawerId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              {menuOpen ? '×' : '☰'}
            </span>
          </button>

          <p className="text-lg font-semibold text-heading">OTCP</p>

          <NavLinks className="ml-auto hidden md:block" />
        </div>

        {menuOpen ? (
          <div className="border-t border-border bg-surface md:hidden">
            <NavLinks
              id={drawerId}
              listClassName="flex flex-col px-2 py-2"
              onNavigate={closeMenu}
            />
          </div>
        ) : null}
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 p-4">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl px-4 py-3">
          <Link
            to="/notices"
            className="text-sm text-text underline decoration-border underline-offset-2 transition-colors hover:text-heading hover:decoration-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
          >
            Notices
          </Link>
        </div>
      </footer>
    </div>
  );
}
