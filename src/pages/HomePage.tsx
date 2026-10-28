import { Link } from 'react-router';
import { DocumentTitle } from '../components/DocumentTitle';
import { SITE_NAME } from '../site';

export function HomePage() {
  return (
    <>
      <DocumentTitle title={SITE_NAME} />
      <h1 className="text-3xl font-semibold tracking-tight">Open TCG Project</h1>
      <p className="mt-4 max-w-prose text-base leading-7">
        A fast trading card reference. When a match or a deck build depends on one line of card
        text, the lookup should be immediate.
      </p>
      <p className="mt-4 max-w-prose text-base leading-7 text-muted">
        This page is the shell. Search, a card grid, filters, and a table view come next. A deck
        builder and an opening-hand simulator follow once the Yu-Gi-Oh! reference is solid.
      </p>
      <p className="mt-8">
        <Link to="/about" className="text-sm underline underline-offset-4">
          About the project
        </Link>
      </p>
    </>
  );
}
