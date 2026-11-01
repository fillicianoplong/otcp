# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-01

### Added

- **M2 — Card data and search:** SchemaCore schemas for published card JSON and pointers.
- DataPipeline fetch, validation, image re-hosting, and atomic pointer swap on publish.
- CardCatalog loading from the published pointer and dataset on the Search page.
- SearchIndex with name and passcode search, plus a latency benchmark script.
- Card detail page with snapshot prices (TCGplayer, CoolStuffInc, Cardmarket) and store deep links.
- Publishing full catalog data and same-origin small card images to GitHub Pages (overlay from `data-refresh`).
- Search grid infinite scroll via batched paging.

## [0.1.0] - 2026-10-31

### Added

- **M1 — Runnable shell:** Vite 7, React 19, TypeScript, and Tailwind 4 scaffold.
- Ink design tokens with light/dark theme and match-system helper.
- Stack V1 mono charcoal favicon and web app manifest icons.
- App shell with routed placeholders, desktop navigation, and phone hamburger menu.
- Notices page with generated open-source license inventory (`notices:generate`).
- GitHub Pages deploy workflow with SPA `404.html` fallback for client-side routing.
- Playwright smoke end-to-end tests against local preview and the live Pages site (including post-deploy smoke in CI).

[Unreleased]: https://github.com/fillicianoplong/otcp/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/fillicianoplong/otcp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/fillicianoplong/otcp/releases/tag/v0.1.0
