# OTCP (Open TCG Project)

Fast web card lookup for trading card game players — search, formats, banlists, deck builder, Lists, and collection. Yu-Gi-Oh! first. Hosted under `/otcp/` on GitHub Pages.

**Status:** Docs 1.0. M0 in progress. CI is set up.

## Docs (1.0)

| Doc | Status |
|---|---|
| [SRS](docs/SRS.md) / [Plong_OTCP_SRS.pdf](docs/Plong_OTCP_SRS.pdf) | Approved 1.0 |
| [Architecture](docs/ARCHITECTURE.md) / [Plong_OTCP_Architecture.pdf](docs/Plong_OTCP_Architecture.pdf) | Approved 1.0 |
| [UI](docs/UI.md) / [Plong_OTCP_UI.pdf](docs/Plong_OTCP_UI.pdf) | Approved 1.0 |
| [Implementation plan](docs/IMPLEMENTATION_PLAN.md) / [Plong_OTCP_Implementation_Plan.pdf](docs/Plong_OTCP_Implementation_Plan.pdf) | Approved 1.0 |

## Roadmap

Work is tracked as issues **W-01..W-77** under milestones **M0..M10**. See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for the ordered plan, definition of done, labels, and drop order for Shoulds.

| Milestone | Focus |
|---|---|
| M0 | Setup and spikes |
| M1 | Runnable shell |
| M2 | Card data and search |
| M3 | Filters and views |
| M4 | Formats |
| M5 | Auth and saved decks |
| M6 | Deck builder and export |
| M7 | Lists and collection |
| M8 | Must complete |
| M9 | Should features |
| M10 | Release |

The GitHub Pages source must be set to GitHub Actions in repository settings by the repository owner before the deploy workflow can publish. A pull request cannot change that setting.

## Issues and pull requests

Every pull request links an issue with `Closes #N` and is one commit. Issue titles are short plain descriptions. Spikes are `Spike S-NN: …`. Docs are `Docs: …`. Each issue has one priority label, one type label, and a milestone.

## Tests and CI

CI runs these checks on pull requests and on pushes to `main`.

- `npm ci` installs dependencies from the lockfile.
- `npm run typecheck` typechecks the TypeScript.
- `npm run lint` runs ESLint.
- `npm run format:check` checks formatting with Prettier.
- `npm run test` runs the Vitest unit tests.
- `npm run test:e2e` runs the Chromium Playwright smoke test.

## License

MIT.
