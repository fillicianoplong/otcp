import { DocumentTitle } from '../components/DocumentTitle';

const ROADMAP = [
  'Project foundation: this shell, checks, and GitHub Pages.',
  'Card schema: a versioned OTCP card record, with a shared core and a per-game extension. Yu-Gi-Oh! is the first extension.',
  'Yu-Gi-Oh! data pipeline: a YGOPRODeck adapter that writes trimmed, chunked JSON. Card lists stay generated, not hand-edited.',
  'Card reference: search, a grid, a card detail view, and shareable URLs.',
  'Filters and a sortable table, with column visibility.',
  'Formats and banlists, including Edison, plus a small file of upstream corrections.',
  'Deck builder, with export.',
  'Opening hand and draw simulator.',
];

export function AboutPage() {
  return (
    <>
      <DocumentTitle title="About" />
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <p className="mt-4 max-w-prose text-base leading-7">
        OTCP started as a simple idea: one fast page for Trading Card Game lookups, instead of
        hunting through forums or slow databases. I am building it for players, collectors, and
        judges, and I want the same object to work once more games are added.
      </p>
      <h2 className="mt-10 text-lg font-semibold">What is here now</h2>
      <p className="mt-2 max-w-prose text-base leading-7">
        A static site shell, the test setup, and the Pages deploy. No card data yet.
      </p>
      <h2 className="mt-10 text-lg font-semibold">Roadmap</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-7">
        {ROADMAP.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <h2 className="mt-10 text-lg font-semibold">License</h2>
      <p className="mt-2 max-w-prose text-base leading-7">
        MIT. Copyright (c) 2026 Filliciano Plong.
      </p>
    </>
  );
}
