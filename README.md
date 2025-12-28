# OTCP (Open TCG Project)

Fast web card lookup for trading card game players — search, formats, banlists, deck builder, Lists, and collection. Yu-Gi-Oh! first. Hosted under `/otcp/` on GitHub Pages.

## Tests and CI

CI runs these checks on pull requests and on pushes to `main`.

- `npm ci` installs dependencies from the lockfile.
- `npm run typecheck` typechecks the TypeScript.
- `npm run lint` runs ESLint.
- `npm run format:check` checks formatting with Prettier.
- `npm run test` runs the Vitest unit tests.
- `npm run test:e2e` runs the Chromium Playwright smoke test.

## Documentation

- [Software Requirements Specification](docs/SRS.md) (version 1.0; also as [Word](docs/Plong_OTCP_SRS.docx) and [PDF](docs/out/Plong_OTCP_SRS.pdf))
- [Architecture (design document)](docs/ARCHITECTURE.md) (version 1.0; also as [Word](docs/Plong_OTCP_Architecture.docx) and [PDF](docs/out/Plong_OTCP_Architecture.pdf))
- [UI design](docs/UI.md) (version 1.0; also as [Word](docs/Plong_OTCP_UI.docx) and [PDF](docs/out/Plong_OTCP_UI.pdf))
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md) (version 1.0; also as [Word](docs/Plong_OTCP_Implementation_Plan.docx) and [PDF](docs/out/Plong_OTCP_Implementation_Plan.pdf))
- [Diagrams](docs/diagrams/) (PlantUML sources, rendered in [docs/images](docs/images/))

## License

MIT.
