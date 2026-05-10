import { useEffect, useState } from 'react';

/** Matches Tailwind `sm` (~640px) used for catalog Table availability. */
export function useMinViewportWidth(minWidthPx: number): boolean {
  const query = `(min-width: ${minWidthPx}px)`;
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (typeof window.matchMedia !== 'function') return true;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
