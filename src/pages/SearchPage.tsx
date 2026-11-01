import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { CardCatalogView } from '../catalog/CardCatalogView';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const SEARCH_DEBOUNCE_MS = 180;

export function SearchPage() {
  const headingId = 'search-heading';
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const next = debouncedQuery.trim();
    setSearchParams(
      (prev) => {
        const current = prev.get('q') ?? '';
        if (next === current) return prev;
        const params = new URLSearchParams(prev);
        if (next.length === 0) {
          params.delete('q');
        } else {
          params.set('q', next);
        }
        return params;
      },
      { replace: true },
    );
  }, [debouncedQuery, setSearchParams]);

  return (
    <div className="flex flex-col gap-6">
      <h1 id={headingId} className="text-2xl font-semibold text-heading">
        Search
      </h1>
      <label htmlFor="card-search-input" className="flex flex-col gap-2">
        <span className="text-sm font-medium text-heading">Find a card</span>
        <input
          id="card-search-input"
          type="search"
          name="card-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or passcode"
          autoComplete="off"
          spellCheck={false}
          className="min-h-[var(--touch-min)] w-full rounded-md border border-border bg-surface px-3 text-base text-text placeholder:text-text-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        />
      </label>
      <CardCatalogView headingId={headingId} searchQuery={debouncedQuery} />
    </div>
  );
}
