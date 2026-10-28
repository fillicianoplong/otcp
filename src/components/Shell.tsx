import { NavLink, Outlet } from 'react-router';
import { NAV_ITEMS, SITE_NAME } from '../site';

export function Shell() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-paper focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <header className="border-b border-ink">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <p className="text-sm font-semibold tracking-[0.18em]">{SITE_NAME}</p>
          <nav aria-label="Primary" className="flex gap-4 text-sm">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive
                    ? 'underline decoration-2 underline-offset-4'
                    : 'text-muted hover:text-ink'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-3xl px-4 py-4 text-sm text-muted">
          MIT License · Filliciano Plong
        </div>
      </footer>
    </div>
  );
}
