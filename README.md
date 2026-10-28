# OTCP

Open TCG Project is a fast trading card reference. I want one page where a name, a line of rules text, or a card id comes back immediately, for a match or a deck build. The same app will grow into a deck builder and an opening-hand simulator.

The site is static and is published at [fillicianoplong.github.io/otcp](https://fillicianoplong.github.io/otcp/).

Yu-Gi-Oh! is the first game. Magic: The Gathering and Pokémon can come later. Adding a game should mean an adapter, an extension on the card schema, and a filter config, not a rewrite.

## Features

This version is the project shell: a home page, an about page, and the build and test setup. Card data, search, and decks are later stages.

## Roadmap

1. **Project foundation.** The app shell, lint, typecheck, unit and end-to-end tests, CI, and GitHub Pages. This stage.
2. **Card schema.** A versioned OTCP card record. Every game shares a core: a stable id, name, rules text, type line, image refs, printings, format legality and ban status, deck limits, and source provenance. Each game adds a typed extension. Yu-Gi-Oh! is the only extension at first. The pipeline and the tests validate the schema and fail on a bad record.
3. **Yu-Gi-Oh! data pipeline.** An adapter pulls free bulk data from YGOPRODeck at build time and writes trimmed, chunked JSON in the OTCP schema. I do not hand-maintain card lists. Small fixtures cover tests. Images follow YGOPRODeck's rules (no hotlinking). A weekly run keeps the published data fresh.
4. **Card reference.** Instant search by name, text, or id, a grid, a card detail view, and shareable URLs.
5. **Filters and table view.** Filters from the per-game config, plus a sortable table with column visibility.
6. **Formats and banlists.** Yu-Gi-Oh! banlist status, the Edison format, and a small overrides file for upstream mistakes. Edison and those overrides are the hand-curated data. Everything else stays generated.
7. **Deck builder.** Create and edit a deck. Export CSV, plaintext, and a share link.
8. **Opening hand / draw simulator.** Shuffle, draw, and an opening hand.

After that I still want deck export to TCGplayer, card comparison, and price lookups. Those wait until the reference and the deck tools are in place.

## Requirements

Node.js 22. The version is pinned in `.nvmrc`.

## Run

```bash
npm ci
npm run dev
```

Open [http://localhost:5173/otcp/](http://localhost:5173/otcp/). The `/otcp/` base path matches GitHub Pages.

```bash
npm run build
npm run preview
```

The preview is at [http://localhost:4173/otcp/](http://localhost:4173/otcp/).

## Test

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run test:e2e
```

`npm run check` runs lint, format, typecheck, and the unit tests. End-to-end tests build the site and run in Chromium. The first Playwright run needs the browser:

```bash
npx playwright install chromium
```

## Deploy

Pushes to `main` run the Deploy workflow, which builds the site and publishes it with GitHub Pages. In the repository settings, Pages has to use **GitHub Actions** as the source. The weekly data refresh arrives with the Yu-Gi-Oh! pipeline.

## Data

No card data in this stage. When the pipeline lands, it will download free bulk data at build time, and the About page will credit the source.

## License

MIT. Copyright (c) 2026 Filliciano Plong. See [LICENSE](LICENSE).
