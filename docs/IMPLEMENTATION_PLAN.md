# Implementation Plan: OTCP

Prepared by: Filliciano Plong · Date: December 27, 2025 · Version: 1.0

**Readers:** Filliciano Plong, developer and tester of OTCP. Status: Approved 2025-12-27. This is the first version of the plan, written before implementation begins.

## Contents

- [Revision history](#revision-history)
- [1. Inputs and how to read this plan](#1-inputs-and-how-to-read-this-plan)
- [2. Versioning scheme](#2-versioning-scheme)
- [3. Milestones](#3-milestones)
- [4. Work items](#4-work-items)
- [5. Traceability](#5-traceability)
- [6. Definition of done](#6-definition-of-done)
- [7. Risks](#7-risks)
- [8. Tracker setup](#8-tracker-setup)
- [9. Decisions and open questions](#9-decisions-and-open-questions)
- [10. Files](#10-files)

## Revision history

| Version | Date | Changes |
|---|---|---|
| 1.0 | December 27, 2025 | First version. |

**Status:** Approved 2025-12-27 by Filliciano Plong. Version 1.0.

## 1. Inputs and how to read this plan

This plan turns the approved requirements and architecture into milestones and small work items. It is the source the Jira items are created from: the tracker takes from this plan, never the other way round.

| Input | Version or choice |
|---|---|
| Requirements | `docs/SRS.md` 1.0, approved 2025-12-27: 78 FRs (74 Must, 4 Should), 18 NFRs (16 Must, 2 Should), acceptance criteria AC-01 to AC-23. |
| Architecture | `docs/ARCHITECTURE.md` 1.0, approved 2025-12-27: components, ADR-001 to ADR-013, spikes S-01 to S-05, risks R-01 to R-08. |
| UI design | `docs/UI.md` 1.0, approved 2025-12-27: Ink theme, Stack V1 mono charcoal mark, List, Grid, and Table views, customizable tables (UI-D10), value summary (UI-D11). |
| Tracker | Jira project OTCP. Each milestone is an Epic (OTCP-1 to OTCP-11) and each work item is a Story or Task under it. |
| How changes land | Direct commits on main, one commit per work item. CI and the Pages deploy run on every push. |
| Repository | fillicianoplong/otcp: Vite 7, React 19, TypeScript, Tailwind 4, Vitest, and Playwright, published on GitHub Pages under `/otcp/`. |

Work items are numbered W-01 to W-77. Each has a Jira key, a priority and type, the FR and NFR IDs it covers, short Given/When/Then acceptance criteria, its tests, and the items it depends on. Musts come first; the Shoulds follow in reverse SRS drop order, so the first to be cut is the last to be built.

Priorities follow the SRS: Must is High, Should is Medium, and Could is Low. The SRS has no Could items. A spike or chore takes the priority of the highest item it unblocks.

M0 runs first: repository chores and the architecture spikes. M1 produces a runnable shell on GitHub Pages. Every Must is done by the end of M8 except the my-value editor (W-77), which follows the condition flags in M9. M10 is the public release.

## 2. Versioning scheme

OTCP uses semantic version numbers (MAJOR.MINOR.PATCH), with `package.json` and `CHANGELOG.md` kept in step. The changelog follows the Keep a Changelog layout, with one section per release.

| Change | Version | Example |
|---|---|---|
| Before the first milestone ships (M0) | No release | Spikes and chores only. |
| A milestone's exit criteria are met (M1 to M9) | Minor bump: 0.N.0, where N is the milestone number | M1 Runnable shell ships as 0.1.0; M2 as 0.2.0. |
| A fix between milestones | Patch bump | 0.2.0 to 0.2.1. |
| Public release (M10) | 1.0.0 | Tagged when the release checklist (W-72) is signed. |

Document versions are separate from app versions. This plan, the SRS, the architecture, and the UI design each carry their own version and revision history.

## 3. Milestones

Each milestone is a Jira Epic with planned start and due dates. Dates go on Epics only, not on their child items.

| Milestone (Epic) | Planned dates | Goal | Items | High / Med / Low |
|---|---|---|---|---|
| **M0 Setup and spikes** (OTCP-1) | Dec 27, 2025 to Jan 2, 2026 | Repository chores done and spikes S-01 to S-05 answered before the features that depend on them. | 8 | 7 / 1 / 0 |
| **M1 Runnable shell** (OTCP-2) | Jan 3, 2026 to Jan 23, 2026 | The Vite and React app deploys to `/otcp/` with Ink chrome, the Stack favicon, and CI. | 7 | 7 / 0 / 0 |
| **M2 Card data and search** (OTCP-3) | Jan 24, 2026 to Apr 24, 2026 | Published card JSON and same-origin art, with typed name and passcode search. | 7 | 7 / 0 / 0 |
| **M3 Filters and views** (OTCP-4) | Apr 25, 2026 to Jul 18, 2026 | Faceted filters; List, Grid, and Table views on search, Lists, and Collection; card detail with official icons. | 8 | 8 / 0 / 0 |
| **M4 Formats** (OTCP-5) | Jul 19, 2026 to Aug 28, 2026 | Format catalog, ban lists, Genesys points, and Speed Duel rules. | 6 | 6 / 0 / 0 |
| **M5 Auth and saved decks** (OTCP-6) | Aug 29, 2026 to Oct 4, 2026 | Supabase sign-in, guest drafts, signed-in save and load, and account deletion. | 6 | 6 / 0 / 0 |
| **M6 Deck builder and export** (OTCP-7) | Oct 5, 2026 to Dec 16, 2026 | The deck builder with the card finder, live validation, and YDK, YDKE, Mass Entry, and text export. | 7 | 7 / 0 / 0 |
| **M7 Lists and collection** (OTCP-8) | Dec 17, 2026 to Feb 12, 2027 | Lists, collection, owned and missing, list sharing, customizable tables, purchase price, value summary, and condition. | 11 | 11 / 0 / 0 |
| **M8 Must complete** (OTCP-9) | Feb 13, 2027 to Mar 31, 2027 | Deck sharing with revoke, accessibility, performance, notices, and cross-browser support, so every Must but the my-value editor (W-77) is done. | 9 | 9 / 0 / 0 |
| **M9 Should features** (OTCP-10) | Apr 1, 2027 to Apr 26, 2027 | The remaining Shoulds in reverse SRS drop order, so the last built is the first cut, plus the my-value editor that finishes FR-78. | 6 | 1 / 5 / 0 |
| **M10 Release** (OTCP-11) | Apr 27, 2027 to May 7, 2027 | Public release with notes and docs that match what shipped. | 2 | 1 / 1 / 0 |
| **Total** |  |  | 77 | 70 / 7 / 0 |

## 4. Work items

Each item lands as one commit on main. The Title column holds the Jira summary and key; the Acceptance column holds the checklist and the tests.

### M0 Setup and spikes (OTCP-1)

**Goal:** Repository chores done and spikes S-01 to S-05 answered before the features that depend on them.

**Exit criteria:** The contribution template and README roadmap are in. Each spike has a findings note under `spikes/` with pass or fail and a fallback. Every UNVERIFIED claim a spike settles has a proposed doc edit.

**Planned dates:** Dec 27, 2025 to Jan 2, 2026.

| ID | Title (Jira) | Priority / type | Covers | Acceptance and tests | Depends on |
|---|---|---|---|---|---|
| W-01 | PR template, README roadmap, and issue notes<br>[OTCP-13](https://fillicianoplong.atlassian.net/browse/OTCP-13)<br>*Area:* `.github/` contribution template, `README.md` | High / Task (chore) | NFR-17 | ☐ Given a new change, when I open the contribution template, then it asks for the Jira key, the acceptance checklist, and test notes.<br>☐ Given the README, when I read the roadmap, then its milestones match this plan and it notes that the Pages source is set by hand.<br>*Tests:* Doc review of the template and README against this plan. | — |
| W-02 | CI typecheck, lint, unit, and Chromium Playwright smoke<br>[OTCP-14](https://fillicianoplong.atlassian.net/browse/OTCP-14)<br>*Area:* `.github/workflows/ci.yml`, Vitest, Playwright | High / Task (test) | NFR-14, NFR-15 | ☐ Given a commit with a planted failing test, when CI runs, then the run fails.<br>☐ Given a green main, when CI runs, then typecheck, lint, unit tests, and the Chromium smoke test all pass.<br>*Tests:* The CI run itself: one red run with the planted failure, one green run without it. | W-01 |
| W-03 | Spike S-01: Search and facet recount latency<br>[OTCP-15](https://fillicianoplong.atlassian.net/browse/OTCP-15)<br>*Area:* `spikes/s01/` | High / Task (spike) | NFR-01; QS-01, R-01, ADR-009, ADR-012 | ☐ Given the client index and bitsets on the reference phone, when I type a name and change facets, then the findings record device, build, timings, and pass or fail against 100 ms.<br>☐ Given a fail, when the spike ends, then the findings name the chosen fallback (worker, precomputed index, virtualization, or lazy data).<br>*Tests:* Spike README with question, build and OS, results table, pass/fail, and proposed doc notes. | W-02 |
| W-04 | Spike S-02: Supabase auth on /otcp/ and CSP<br>[OTCP-16](https://fillicianoplong.atlassian.net/browse/OTCP-16)<br>*Area:* `spikes/s02/` | High / Task (spike) | ADR-006, R-02, R-07 | ☐ Given a free-tier Supabase project and the documented CSP, when I sign in with email and with Google from the real `/otcp/` origin, then both work.<br>☐ Given the project, when the spike ends, then plan limits for rows, auth users, and storage are written down.<br>*Tests:* Spike README with question, build and OS, results table, pass/fail, and proposed doc notes. | W-02 |
| W-05 | Spike S-03: Goat, HAT, and Tengu banlist snapshots<br>[OTCP-17](https://fillicianoplong.atlassian.net/browse/OTCP-17)<br>*Area:* `spikes/s03/` | Medium / Task (spike) | ADR-004, R-03 | ☐ Given cited sources for Goat, HAT, and Tengu, when I assemble the snapshots, then each has a file plus a list of gaps and disputed cards.<br>*Tests:* Spike README with sources, snapshot files, and the gap list. | — |
| W-06 | Spike S-04: npm license scan on the project shell lockfile<br>[OTCP-18](https://fillicianoplong.atlassian.net/browse/OTCP-18)<br>*Area:* `spikes/s04/` | High / Task (spike) | NFR-18; R-04 | ☐ Given the project shell lockfile, when I run a license scan, then every package has a license and any non-permissive one is listed for the Notices page.<br>*Tests:* Spike README with the license inventory and the scan command. | W-02 |
| W-07 | Spike S-05: Speed Duel Skill ids in public YDK<br>[OTCP-19](https://fillicianoplong.atlassian.net/browse/OTCP-19)<br>*Area:* `spikes/s05/` | High / Task (spike) | ADR-010, R-05 | ☐ Given a sample of public Speed Duel YDK files, when I check where Skill ids sit, then the findings confirm they appear under `#main` or document a fallback rule.<br>*Tests:* Spike README with the corpus, counts, and the rule chosen. | — |
| W-08 | Docs: Record spike results and draft doc edits<br>[OTCP-20](https://fillicianoplong.atlassian.net/browse/OTCP-20)<br>*Area:* `docs/drafts/`, `spikes/s0N/README.md` | High / Task (docs) | NFR-17 | ☐ Given each finished spike, when it settles an UNVERIFIED claim, then a proposed SRS or architecture edit cites the spike as its source.<br>*Tests:* Doc review against the spike findings. | W-03 to W-07 |

### M1 Runnable shell (OTCP-2)

**Goal:** The Vite and React app deploys to `/otcp/` with Ink chrome, the Stack favicon, and CI.

**Exit criteria:** `npm start` opens Home. The Actions build and Pages deploy succeed once the Pages source is GitHub Actions. The Stack V1 favicon ships. The smoke test passes in Chromium.

**Planned dates:** Jan 3, 2026 to Jan 23, 2026.

| ID | Title (Jira) | Priority / type | Covers | Acceptance and tests | Depends on |
|---|---|---|---|---|---|
| W-09 | Scaffold Vite 7, React 19, TypeScript, and Tailwind 4<br>[OTCP-21](https://fillicianoplong.atlassian.net/browse/OTCP-21)<br>*Area:* `package.json`, `vite.config.ts`, `src/` | High / Story (feature) | ADR-001, OD-04 | ☐ Given a fresh clone on Node 22, when I run `npm start`, then the app serves Home under the `/otcp/` base.<br>*Tests:* Unit: a render test of the root; CI typecheck and lint. | W-02 |
| W-10 | Ink tokens and match system theme<br>[OTCP-22](https://fillicianoplong.atlassian.net/browse/OTCP-22)<br>*Area:* `src/styles/`, Ink tokens through Tailwind `@theme` | High / Story (feature) | NFR-13; UI-D1, UI-D3 | ☐ Given the system theme is light or dark, when the app loads, then it follows `prefers-color-scheme` and a `data-theme` override.<br>☐ Given the token pairs, when I check contrast, then each pair meets the UI 1.0 contrast table.<br>*Tests:* Unit: theme switch test; E2E: a light and a dark screenshot. | W-09 |
| W-11 | Stack V1 Mono charcoal favicon and manifest<br>[OTCP-23](https://fillicianoplong.atlassian.net/browse/OTCP-23)<br>*Area:* `public/`, manifest icons | High / Story (feature) | FR-55; UI-D6 | ☐ Given the built site, when a browser loads it, then the favicon and 192/512 icons are the Stack V1 mono charcoal mark.<br>☐ Given the manifest, when I inspect the site, then there is no service worker or offline mode.<br>*Tests:* E2E: favicon and manifest load from `/otcp/`; no service worker registers. | W-09 |
| W-12 | AppShell routes, desktop nav, and phone hamburger<br>[OTCP-24](https://fillicianoplong.atlassian.net/browse/OTCP-24)<br>*Area:* AppShell | High / Story (feature) | NFR-12; UI-D4 | ☐ Given a desktop at 1280 px, when the app loads, then the nav shows Search, Formats, Decks, Collection, Lists, and Account, with no Builder route.<br>☐ Given a phone at 375 px, when I open the menu, then the same items appear in a hamburger menu.<br>*Tests:* Unit: nav items; E2E: 375 and 1280 px layouts. | W-10 |
| W-13 | Docs: Notices page stub and license placeholder<br>[OTCP-25](https://fillicianoplong.atlassian.net/browse/OTCP-25)<br>*Area:* Notices screen | High / Task (docs) | NFR-18 | ☐ Given the Notices page, when I open it, then it lists the stack's licenses, with the full list to follow the S-04 scan.<br>*Tests:* E2E: Notices route renders. | W-12, W-06 |
| W-14 | Pages deploy workflow with Actions artifact<br>[OTCP-26](https://fillicianoplong.atlassian.net/browse/OTCP-26)<br>*Area:* `.github/workflows/pages.yml` | High / Task (packaging) | NFR-03; ADR-001, OD-09 | ☐ Given a push to main, when the workflow runs, then it builds and uploads a Pages artifact and deploys it.<br>☐ Given the repo settings, when I set the Pages source to GitHub Actions by hand, then the site serves from the workflow.<br>*Tests:* The deploy run on main; the live `/otcp/` URL loads. | W-09 |
| W-15 | Smoke e2e: home loads under /otcp/<br>[OTCP-27](https://fillicianoplong.atlassian.net/browse/OTCP-27)<br>*Area:* Playwright | High / Task (test) | NFR-16 | ☐ Given the deployed or previewed build, when Chromium opens `/otcp/`, then it returns 200 with the shell's nav landmarks.<br>*Tests:* E2E: Chromium smoke test in CI. | W-12, W-14 |

### M2 Card data and search (OTCP-3)

**Goal:** Published card JSON and same-origin art, with typed name and passcode search.

**Exit criteria:** AC-01 passes with the latency recorded. AC-10 and AC-11 pass for refresh and image origin. The schema validates.

**Planned dates:** Jan 24, 2026 to Apr 24, 2026.

| ID | Title (Jira) | Priority / type | Covers | Acceptance and tests | Depends on |
|---|---|---|---|---|---|
| W-16 | SchemaCore versioned core and Yu-Gi-Oh! extension<br>[OTCP-28](https://fillicianoplong.atlassian.net/browse/OTCP-28)<br>*Area:* `src/shared/schema` | High / Story (feature) | FR-46, FR-48, FR-50, FR-51; AC-15 | ☐ Given valid fixtures, when the schema validates them, then they pass.<br>☐ Given a record with an unknown or missing required field, when it is validated, then the test fails.<br>☐ Given the game selector, when I look for games, then only Yu-Gi-Oh! is offered.<br>*Tests:* Unit: schema fixtures, good and bad. | W-09 |
| W-17 | DataPipeline fetch, validate, and publish pointer<br>[OTCP-29](https://fillicianoplong.atlassian.net/browse/OTCP-29)<br>*Area:* `pipeline/`, refresh workflow | High / Story (feature) | FR-47, FR-52, FR-53, NFR-08; AC-10, QS-03 | ☐ Given an upstream pull, when every record validates, then the published pointer swaps to the new data in one step.<br>☐ Given an invalid record, when the refresh runs, then it fails closed and the prior pointer stays live.<br>*Tests:* Unit: pipeline with a good and a bad fixture; the workflow's dry run. | W-16 |
| W-18 | Re-host card images same-origin<br>[OTCP-30](https://fillicianoplong.atlassian.net/browse/OTCP-30)<br>*Area:* Pipeline image step | High / Story (feature) | FR-54, NFR-05; AC-11 | ☐ Given 20 sample cards, when I capture network requests on search and detail, then no image loads from `images.ygoprodeck.com`.<br>*Tests:* E2E: network capture on 20 cards. | W-17 |
| W-19 | CardCatalog loads published JSON<br>[OTCP-31](https://fillicianoplong.atlassian.net/browse/OTCP-31)<br>*Area:* CardCatalog, Home and Search | High / Story (feature) | FR-09 | ☐ Given published JSON, when Home loads, then cards appear after the index loads.<br>☐ Given a failed or empty load, when Home loads, then a clear error or empty state shows.<br>*Tests:* Unit: catalog loader states; E2E: Home shows cards. | W-17, W-12 |
| W-20 | SearchIndex typed name and passcode<br>[OTCP-32](https://fillicianoplong.atlassian.net/browse/OTCP-32)<br>*Area:* SearchIndex | High / Story (feature) | FR-01, FR-02, FR-03, NFR-01; AC-01 | ☐ Given a unique name substring or a passcode, when I type it, then the card is in the results.<br>☐ Given the reference phone, when I type, then the latency is recorded against the S-01 target.<br>*Tests:* Unit: name and passcode lookups; E2E: typed search. | W-19, W-03 |
| W-21 | Price fields on detail from published snapshot<br>[OTCP-33](https://fillicianoplong.atlassian.net/browse/OTCP-33)<br>*Area:* PriceView | High / Story (feature) | FR-44, FR-45; AC-09 | ☐ Given a card with a price snapshot, when I open its detail, then TCGplayer, CSI, and Cardmarket fields show from the published data.<br>*Tests:* Unit: price formatting; E2E: detail shows prices. | W-19 |
| W-22 | Store deep links open new tab<br>[OTCP-34](https://fillicianoplong.atlassian.net/browse/OTCP-34)<br>*Area:* PriceView | High / Story (feature) | FR-45; ADR-008 | ☐ Given the price section, when I choose a store, then its page opens in a new tab and nothing is scraped from its API.<br>*Tests:* Unit: link targets and `rel`; E2E: new tab opens. | W-21 |

### M3 Filters and views (OTCP-4)

**Goal:** Faceted filters; List, Grid, and Table views on search, Lists, and Collection; card detail with official icons.

**Exit criteria:** AC-02, AC-03, and AC-19 pass. The Search, Results, Detail, Lists Table, and Collection Table screens match UI 1.0.

**Planned dates:** Apr 25, 2026 to Jul 18, 2026.

| ID | Title (Jira) | Priority / type | Covers | Acceptance and tests | Depends on |
|---|---|---|---|---|---|
| W-23 | FilterEngine and facet declarations<br>[OTCP-35](https://fillicianoplong.atlassian.net/browse/OTCP-35)<br>*Area:* FilterEngine | High / Story (feature) | FR-04, FR-56, FR-57; ADR-012 | ☐ Given core and game facets, when I combine include, exclude, AND, and OR, then the results match the rules.<br>*Tests:* Unit: FilterEngine tests in Node. | W-16, W-03 |
| W-24 | Facet UI desktop sidebar and phone Filters sheet<br>[OTCP-36](https://fillicianoplong.atlassian.net/browse/OTCP-36)<br>*Area:* Search filters, desktop sidebar, phone sheet | High / Story (feature) | FR-05, FR-56, FR-57, FR-58 | ☐ Given a filter change, when results update, then facet counts and chips update live.<br>☐ Given active filters, when I choose Clear all, then every filter clears and the full list returns.<br>☐ Given a phone, when I filter in the sheet, then a See N results button closes it.<br>*Tests:* Unit: chips and clear all; E2E: desktop sidebar and phone sheet. | W-23, W-19 |
| W-25 | List view with official icons and ban markers<br>[OTCP-37](https://fillicianoplong.atlassian.net/browse/OTCP-37)<br>*Area:* Search results, List view | High / Story (feature) | FR-60 | ☐ Given results in List view, when a row renders, then it shows the thumbnail, game icons, ATK/DEF badges, and a ban marker for the selected format.<br>*Tests:* Unit: row rendering; E2E: List view screenshot. | W-19, W-20 |
| W-26 | Grid view with at least three columns on phone<br>[OTCP-38](https://fillicianoplong.atlassian.net/browse/OTCP-38)<br>*Area:* Search results, Grid view | High / Story (feature) | FR-60 | ☐ Given a phone 360 to 430 CSS px wide, when I switch to Grid, then at least three columns of art with overlays show.<br>*Tests:* E2E: Grid at 360 and 430 px. | W-25 |
| W-27 | Table view on search, Lists, and Collection<br>[OTCP-39](https://fillicianoplong.atlassian.net/browse/OTCP-39)<br>*Area:* Table view on Search, Lists, and Collection | High / Story (feature) | FR-06, FR-07, FR-60; UI-D9 | ☐ Given a desktop, when I switch to Table, then columns sort on search, Lists, and Collection.<br>☐ Given a screen under about 640 px, when the page loads, then Table is hidden and List and Grid remain.<br>*Tests:* Unit: column sort; E2E: Table at 1280 px, hidden at 375 px. | W-25 |
| W-28 | View preference persistence<br>[OTCP-40](https://fillicianoplong.atlassian.net/browse/OTCP-40)<br>*Area:* AppShell view preference | High / Story (feature) | FR-60; AC-19 | ☐ Given I pick a view, when I come back later, then the same view opens.<br>☐ Given a first visit on desktop search, when results load, then Grid is the default.<br>*Tests:* Unit: preference store; E2E: reload keeps the view. | W-26, W-27 |
| W-29 | Card detail stacked phone and two-column desktop<br>[OTCP-41](https://fillicianoplong.atlassian.net/browse/OTCP-41)<br>*Area:* Card detail | High / Story (feature) | FR-09, FR-10, FR-11; AC-03 | ☐ Given a card, when I open its detail on a phone, then the layout stacks; on desktop it shows two columns.<br>☐ Given a format, when I view the detail, then the ban status matches that format and the chips are labeled.<br>*Tests:* Unit: detail sections; E2E: phone and desktop layouts. | W-19 |
| W-30 | Official icon assets and SOURCES.md wiring<br>[OTCP-42](https://fillicianoplong.atlassian.net/browse/OTCP-42)<br>*Area:* `public/icons/`, baked assets, `SOURCES.md` | High / Story (feature) | FR-60 | ☐ Given List and detail views, when icons render, then they use the approved baked icons listed in `SOURCES.md`, with a 16 px Link marker.<br>*Tests:* E2E: icon screenshots; doc review of `SOURCES.md`. | W-25 |

### M4 Formats (OTCP-5)

**Goal:** Format catalog, ban lists, Genesys points, and Speed Duel rules.

**Exit criteria:** AC-04, AC-16, AC-17, and AC-18 (rules half) pass. The Formats screens match UI 1.0.

**Planned dates:** Jul 19, 2026 to Aug 28, 2026.

| ID | Title (Jira) | Priority / type | Covers | Acceptance and tests | Depends on |
|---|---|---|---|---|---|
| W-31 | Format catalog and Advanced / Traditional<br>[OTCP-43](https://fillicianoplong.atlassian.net/browse/OTCP-43)<br>*Area:* FormatEngine, Formats | High / Story (feature) | FR-12, FR-13, FR-14, FR-15 | ☐ Given a selected format, when I search, then its card pool and Forbidden, Limited, and Semi-Limited lists apply.<br>☐ Given Advanced or Traditional, when I switch, then the ban statuses switch with it.<br>*Tests:* Unit: format rules; E2E: switching formats. | W-23 |
| W-32 | Edison curated snapshot<br>[OTCP-44](https://fillicianoplong.atlassian.net/browse/OTCP-44)<br>*Area:* Formats, Edison snapshot | High / Story (feature) | FR-20; AC-04 | ☐ Given Edison, when I search, then cards released after Edison are absent.<br>☐ Given a Forbidden card, when I try to add it in Edison, then it is refused.<br>*Tests:* Unit: Edison pool and bans. | W-31, W-05 |
| W-33 | Goat / HAT / Tengu from S-03<br>[OTCP-45](https://fillicianoplong.atlassian.net/browse/OTCP-45)<br>*Area:* Formats, Goat, HAT, and Tengu snapshots | High / Story (feature) | FR-13; R-03 | ☐ Given the S-03 snapshots, when I pick Goat, HAT, or Tengu, then each loads, and its gaps are documented.<br>*Tests:* Unit: snapshot loading. | W-31, W-05 |
| W-34 | Genesys points and caps<br>[OTCP-46](https://fillicianoplong.atlassian.net/browse/OTCP-46)<br>*Area:* FormatEngine, builder rules | High / Story (feature) | FR-18, FR-19, FR-49; AC-17 | ☐ Given Genesys, when I add a Link monster, then it is refused.<br>☐ Given the default 100-point cap or a custom cap, when a deck goes over, then it is flagged.<br>☐ Given a data refresh, when Konami's points change, then a diff report is produced.<br>*Tests:* Unit: points, caps, and diff report. | W-31, W-17 |
| W-35 | Speed Duel pool and Skill rules<br>[OTCP-47](https://fillicianoplong.atlassian.net/browse/OTCP-47)<br>*Area:* FormatEngine, Speed Duel | High / Story (feature) | FR-16, FR-17, FR-26; AC-18 | ☐ Given Speed Duel, when I add a non-Speed card, then it is refused.<br>☐ Given a Speed Duel deck, when I add Skills or Main cards, then it allows one Skill and at most 30 Main cards.<br>*Tests:* Unit: Speed Duel rules. | W-31, W-07 |
| W-36 | Format ban list pages and card pool<br>[OTCP-48](https://fillicianoplong.atlassian.net/browse/OTCP-48)<br>*Area:* Formats screens | High / Story (feature) | FR-12, FR-13 | ☐ Given the Formats page, when I open a format, then I can browse its ban list and card pool in List or Grid.<br>*Tests:* E2E: Formats browse. | W-32 to W-35 |

### M5 Auth and saved decks (OTCP-6)

**Goal:** Supabase sign-in, guest drafts, signed-in save and load, and account deletion.

**Exit criteria:** AC-07 passes. The Account screen works on the live origin. The guest-to-sign-in import prompt works (QS-04).

**Planned dates:** Aug 29, 2026 to Oct 4, 2026.

| ID | Title (Jira) | Priority / type | Covers | Acceptance and tests | Depends on |
|---|---|---|---|---|---|
| W-37 | Supabase project wiring and RLS migrations<br>[OTCP-49](https://fillicianoplong.atlassian.net/browse/OTCP-49)<br>*Area:* `supabase/` migrations | High / Task (security) | NFR-04, NFR-06; ADR-006, ADR-013 | ☐ Given the migrations, when they run, then the tables and row-level security match Architecture 1.0.<br>☐ Given the client bundle, when I search it, then only the anon key is present.<br>*Tests:* Migration test against a local database; bundle scan for secrets. | W-04 |
| W-38 | Auth client email/password and Google<br>[OTCP-50](https://fillicianoplong.atlassian.net/browse/OTCP-50)<br>*Area:* Account | High / Story (feature) | FR-32, FR-33, FR-34; OD-06 | ☐ Given the `/otcp/` origin, when I sign up or sign in with email or Google, then my session starts and comes back on return.<br>☐ Given I am signed in, when I sign out, then the local session clears.<br>*Tests:* Unit: auth client; E2E: sign-in and sign-out against a test project. | W-37, W-12 |
| W-39 | Guest deck drafts in browser storage<br>[OTCP-51](https://fillicianoplong.atlassian.net/browse/OTCP-51)<br>*Area:* DeckStore, guest drafts | High / Story (feature) | FR-27, FR-36 | ☐ Given a guest, when I build a deck, then it persists in browser storage.<br>☐ Given a guest, when I choose Save or Share, then I am asked to sign in.<br>*Tests:* Unit: draft storage. | W-12 |
| W-40 | Signed-in deck save / load<br>[OTCP-52](https://fillicianoplong.atlassian.net/browse/OTCP-52)<br>*Area:* DeckStore, Decks | High / Story (feature) | FR-36, FR-38; QS-04 | ☐ Given a saved deck, when I sign in on another browser, then it loads.<br>☐ Given guest drafts, when I first sign in, then I am asked once to import them, and a decline sticks.<br>*Tests:* Unit: save and load; E2E: import prompt. | W-38, W-39 |
| W-41 | Account deletion (hard delete live data)<br>[OTCP-53](https://fillicianoplong.atlassian.net/browse/OTCP-53)<br>*Area:* Account deletion | High / Task (security) | FR-35, NFR-07; QS-06, AC-07 | ☐ Given I delete my account, when it completes, then I cannot sign in and my decks, lists, collection, and shares are gone at once.<br>*Tests:* Unit: delete flow; E2E against a test project. | W-40 |
| W-42 | Profile view preference sync<br>[OTCP-54](https://fillicianoplong.atlassian.net/browse/OTCP-54)<br>*Area:* AppShell, profile | High / Story (feature) | FR-60 | ☐ Given I am signed in, when I change my view preference, then it syncs to my profile.<br>☐ Given a guest, when I change it, then it stays in this browser only.<br>*Tests:* Unit: preference sync. | W-28, W-38 |

### M6 Deck builder and export (OTCP-7)

**Goal:** The deck builder with the card finder, live validation, and YDK, YDKE, Mass Entry, and text export.

**Exit criteria:** AC-05 and AC-06 pass. The Decks and builder screens match UI 1.0.

**Planned dates:** Oct 5, 2026 to Dec 16, 2026.

| ID | Title (Jira) | Priority / type | Covers | Acceptance and tests | Depends on |
|---|---|---|---|---|---|
| W-43 | Deck builder shell from Decks<br>[OTCP-55](https://fillicianoplong.atlassian.net/browse/OTCP-55)<br>*Area:* DeckBuilder | High / Story (feature) | FR-21, FR-22 | ☐ Given Decks, when I open a deck, then the builder shows Main, Extra, and Side (and Skill for Speed Duel).<br>☐ Given the nav, when I look for the builder, then it opens only from Decks.<br>*Tests:* Unit: deck sections; E2E: open from Decks. | W-40, W-31 |
| W-44 | Card finder shared control<br>[OTCP-56](https://fillicianoplong.atlassian.net/browse/OTCP-56)<br>*Area:* CardFinder | High / Story (feature) | FR-71; UI-D8 | ☐ Given the deck, list, or collection editor, when I search in the finder, then I can add a card from the results.<br>*Tests:* Unit: finder control; E2E: add in each editor. | W-20, W-43 |
| W-45 | Live deck validation<br>[OTCP-57](https://fillicianoplong.atlassian.net/browse/OTCP-57)<br>*Area:* DeckBuilder validation | High / Story (feature) | FR-14, FR-23, FR-24, FR-25, FR-26; AC-04, AC-16, AC-17, AC-18 | ☐ Given a format, when I add an illegal or over-limit card, then the builder refuses it and says why.<br>*Tests:* Unit: validation per format. | W-43, W-34, W-35 |
| W-46 | Export codec YDK / YDKE / Mass Entry / text<br>[OTCP-58](https://fillicianoplong.atlassian.net/browse/OTCP-58)<br>*Area:* ExportCodec | High / Story (feature) | FR-28, FR-29, FR-31; AC-06 | ☐ Given a deck, when I export YDK, YDKE, Mass Entry, or text, then each matches its reference format.<br>☐ Given a Speed Duel YDK, when I export and import it, then the Skill comes back under `#main`.<br>*Tests:* Unit: round-trip tests per format. | W-43, W-07 |
| W-47 | Import YDK<br>[OTCP-59](https://fillicianoplong.atlassian.net/browse/OTCP-59)<br>*Area:* ExportCodec, Decks | High / Story (feature) | FR-31 | ☐ Given a YDK file, when I import it, then a deck is built.<br>☐ Given an invalid file, when I import it, then it is refused safely.<br>*Tests:* Unit: import parser, good and bad files. | W-46 |
| W-48 | Guest export without account<br>[OTCP-60](https://fillicianoplong.atlassian.net/browse/OTCP-60)<br>*Area:* Decks, guest export | High / Story (feature) | FR-27; AC-05 | ☐ Given a guest, when I export a deck, then it downloads without an account, while Save and Share still ask me to sign in.<br>*Tests:* E2E: guest export. | W-46, W-39 |
| W-49 | Deck list screen (saved and drafts)<br>[OTCP-61](https://fillicianoplong.atlassian.net/browse/OTCP-61)<br>*Area:* Decks list | High / Story (feature) | FR-37, FR-40 | ☐ Given saved decks and drafts, when I open Decks, then each shows its name, format, and last updated time.<br>☐ Given a saved deck, when I delete it and confirm, then it is gone; with no decks, an empty state shows.<br>*Tests:* Unit: list and delete; E2E: Decks page. | W-40, W-43 |

### M7 Lists and collection (OTCP-8)

**Goal:** Lists, collection, owned and missing, list sharing, customizable tables, purchase price, value summary, and condition.

**Exit criteria:** AC-20, AC-21 (without FR-68), AC-22, and AC-23 pass. The Lists and Collection screens match UI 1.0.

**Planned dates:** Dec 17, 2026 to Feb 12, 2027.

| ID | Title (Jira) | Priority / type | Covers | Acceptance and tests | Depends on |
|---|---|---|---|---|---|
| W-50 | Want list store and Lists CRUD<br>[OTCP-62](https://fillicianoplong.atlassian.net/browse/OTCP-62)<br>*Area:* Lists | High / Story (feature) | FR-61, FR-62, FR-70 | ☐ Given Lists, when I create a named list, then I can add cards with quantity, set, rarity, and a note.<br>☐ Given a guest, when I add to a list, then it saves in the browser; signed in, it saves to my account.<br>*Tests:* Unit: list store; E2E: create and edit a list. | W-37, W-12 |
| W-51 | List market totals via Value summary<br>[OTCP-63](https://fillicianoplong.atlassian.net/browse/OTCP-63)<br>*Area:* Lists, Value summary | High / Story (feature) | FR-62, FR-76 | ☐ Given a list, when it has priced cards, then the market total is the TCGplayer price times quantity, shown in the value summary bar, not the count line.<br>*Tests:* Unit: list totals. | W-50, W-21, W-75 |
| W-52 | Check-off adds to collection<br>[OTCP-64](https://fillicianoplong.atlassian.net/browse/OTCP-64)<br>*Area:* Lists, Collection check-off | High / Story (feature) | FR-63, FR-64 | ☐ Given a want-list entry, when I check it off, then it is marked acquired and the printing is added to my collection.<br>☐ Given a purchase price on the entry, when I check it off, then I can copy it onto the collection item.<br>*Tests:* Unit: check-off; E2E: list to collection. | W-50, W-53 |
| W-53 | Collection store and add from search/detail/deck<br>[OTCP-65](https://fillicianoplong.atlassian.net/browse/OTCP-65)<br>*Area:* Collection | High / Story (feature) | FR-66, FR-67 | ☐ Given search, detail, or a deck, when I add a card to my collection, then it saves with quantity and printing.<br>☐ Given Collection, when I open it, then Table is the desktop default and a phone shows compact icon rows.<br>*Tests:* Unit: collection store; E2E: add from search and detail. | W-37, W-29 |
| W-54 | Owned/missing in deck builder<br>[OTCP-66](https://fillicianoplong.atlassian.net/browse/OTCP-66)<br>*Area:* DeckBuilder owned and missing | High / Story (feature) | FR-69; AC-21 | ☐ Given a deck and a collection, when I open the builder, then each card shows owned or missing, and I can add the missing ones to a list.<br>*Tests:* Unit: owned/missing counts. | W-53, W-43, W-50 |
| W-55 | List export Mass Entry and plain text<br>[OTCP-67](https://fillicianoplong.atlassian.net/browse/OTCP-67)<br>*Area:* Lists export | High / Story (feature) | FR-65 | ☐ Given a list, when I export it as Mass Entry or plain text, then it matches the reference formats.<br>*Tests:* Unit: list export formats. | W-50 |
| W-56 | List share create and read-only page<br>[OTCP-68](https://fillicianoplong.atlassian.net/browse/OTCP-68)<br>*Area:* ShareService, Lists | High / Story (feature) | FR-41, FR-42, FR-65 | ☐ Given I am signed in, when I share a list, then a read-only link is created; a guest is asked to sign in first.<br>☐ Given the link, when anyone opens it, then the list shows read-only.<br>*Tests:* Unit: share token; E2E: open a shared list. | W-50, W-38 |
| W-73 | Shared data table and column config store<br>[OTCP-69](https://fillicianoplong.atlassian.net/browse/OTCP-69)<br>*Area:* DataTable, ColumnConfigStore, AppShell | High / Story (feature) | FR-06, FR-08, FR-72, FR-73, FR-74; UI-D9, UI-D10, AC-22 | ☐ Given Search, Lists, or Collection on a desktop, when the page loads, then Table is the default; a phone shows compact icon rows.<br>☐ Given a table, when I sort, filter a column, reorder, resize, or pick columns, then the same setup comes back when I reopen it.<br>☐ Given any table, when it loads, then the count line shows the card count only, in the same format as Search.<br>*Tests:* Unit: column config store; E2E: customize, reload, setup restored. | W-27, W-37 |
| W-74 | Purchase price field on collection and list items<br>[OTCP-70](https://fillicianoplong.atlassian.net/browse/OTCP-70)<br>*Area:* CollectionStore, WantListStore, schema | High / Story (feature) | FR-75 | ☐ Given a collection or want-list item, when I enter what I paid, then it saves as a nullable USD purchase price, editable in the editor and the table.<br>☐ Given a deck, when a card matches a collection printing, then it uses that item's purchase price.<br>*Tests:* Unit: purchase price storage and inheritance. | W-50, W-53, W-37 |
| W-75 | Value summary bar (current / paid / P/L)<br>[OTCP-71](https://fillicianoplong.atlassian.net/browse/OTCP-71)<br>*Area:* ValueSummary | High / Story (feature) | FR-76, FR-78; UI-D11, AC-23 | ☐ Given Collection, a list, or a deck, when it has priced cards, then the bar shows Current, Paid, P/L, and N of M priced.<br>☐ Given an item with my value set, when totals are computed, then Current uses my value times quantity.<br>☐ Given the toolbar, when it shows counts, then no prices appear there.<br>*Tests:* Unit: value math; E2E: summary bar on each page. | W-74, W-51, W-43 |
| W-76 | Condition and variant flags on items<br>[OTCP-72](https://fillicianoplong.atlassian.net/browse/OTCP-72)<br>*Area:* CollectionStore, WantListStore, DeckBuilder, DataTable | High / Story (feature) | FR-77 | ☐ Given an item, when I set condition (NM, LP, MP, HP, DMG) or the EU, 1st, or faded flags and a note, then they save and Condition shows by default in the Collection table.<br>☐ Given a condition, when prices show, then market price is not adjusted.<br>*Tests:* Unit: condition and flags; E2E: edit in the table. | W-74, W-73 |

### M8 Must complete (OTCP-9)

**Goal:** Deck sharing with revoke, accessibility, performance, notices, and cross-browser support, so every Must but the my-value editor (W-77) is done.

**Exit criteria:** AC-08 passes in full (create, open, revoke), along with AC-09 and AC-12 to AC-15. Every Must acceptance criterion passes in the regression pack.

**Planned dates:** Feb 13, 2027 to Mar 31, 2027.

| ID | Title (Jira) | Priority / type | Covers | Acceptance and tests | Depends on |
|---|---|---|---|---|---|
| W-57 | Deck share create and read-only view<br>[OTCP-74](https://fillicianoplong.atlassian.net/browse/OTCP-74)<br>*Area:* ShareService | High / Story (feature) | FR-41, FR-42; AC-08, R-08 | ☐ Given a saved deck, when I share it, then the link uses an opaque token of at least 128 bits, stored only as a hash.<br>☐ Given the link, when anyone opens it, then the deck shows read-only and the page sends a Referrer-Policy.<br>*Tests:* Unit: token entropy and hashing; E2E: open a shared deck. | W-40 |
| W-58 | Accessibility pass (WCAG 2.2 AA)<br>[OTCP-75](https://fillicianoplong.atlassian.net/browse/OTCP-75)<br>*Area:* AppShell primary screens | High / Task (test) | NFR-09, NFR-10, NFR-11; AC-13, QS-07 | ☐ Given the primary screens, when I use only a keyboard, then UC-01, UC-05, and UC-06 can be completed.<br>☐ Given an axe scan, when it runs, then it is clean, and ban status is never shown by color alone.<br>*Tests:* E2E: keyboard paths and axe scans. | W-24, W-43, W-29 |
| W-59 | First load ≤2 s target<br>[OTCP-76](https://fillicianoplong.atlassian.net/browse/OTCP-76)<br>*Area:* AppShell | High / Task (test) | NFR-02; AC-12, QS-02 | ☐ Given the reference device and network, when I load the site cold, then first load is 2 seconds or less, with the method and device recorded.<br>*Tests:* Measured run recorded in the repo. | W-19, W-14 |
| W-60 | Cross-browser smoke<br>[OTCP-77](https://fillicianoplong.atlassian.net/browse/OTCP-77)<br>*Area:* E2E | High / Task (test) | NFR-12, NFR-16; AC-14 | ☐ Given Chrome, Firefox, Safari, and Edge on desktop plus one mobile engine, when I run UC-01 and UC-05, then they pass.<br>*Tests:* E2E: smoke suite on each browser. | W-43, W-24 |
| W-61 | Docs: Notices page final licenses<br>[OTCP-78](https://fillicianoplong.atlassian.net/browse/OTCP-78)<br>*Area:* Notices | High / Task (docs) | NFR-18 | ☐ Given the S-04 inventory, when I open Notices, then every license is listed and none is incompatible without an explanation.<br>*Tests:* Doc review against the license scan. | W-13, W-06 |
| W-62 | Security review fixes from docs/reviews<br>[OTCP-79](https://fillicianoplong.atlassian.net/browse/OTCP-79)<br>*Area:* CSP, RLS, shares | High / Task (security) | NFR-03, NFR-04, NFR-05, NFR-06, NFR-07 | ☐ Given the security review checklist, when this item ends, then each finding is fixed or deferred with my note.<br>*Tests:* Tests added for each fix; the checklist kept in `docs/reviews/`. | W-37, W-57 |
| W-63 | Schema/export unit coverage gate<br>[OTCP-80](https://fillicianoplong.atlassian.net/browse/OTCP-80)<br>*Area:* CI coverage | High / Task (test) | NFR-14, NFR-15 | ☐ Given CI, when tests run, then the coverage thresholds for the schema and ExportCodec are met, or the run fails.<br>*Tests:* The CI coverage step. | W-16, W-46 |
| W-64 | Must AC regression pack<br>[OTCP-81](https://fillicianoplong.atlassian.net/browse/OTCP-81)<br>*Area:* `tests/` | High / Task (test) | AC-01 to AC-21 (Must paths) | ☐ Given every Must acceptance criterion, when the regression pack runs, then each is scripted or demo-scripted and green.<br>*Tests:* The regression pack itself. | W-57 to W-63, W-65 |
| W-65 | Revoke share link<br>[OTCP-82](https://fillicianoplong.atlassian.net/browse/OTCP-82)<br>*Area:* ShareService | High / Story (feature) | FR-43; AC-08 | ☐ Given a shared deck or list, when I revoke its link, then the old URL no longer opens it.<br>*Tests:* Unit: revoke; E2E: revoked link fails. | W-57 |

### M9 Should features (OTCP-10)

**Goal:** The remaining Shoulds in reverse SRS drop order, so the last built is the first cut, plus the my-value editor that finishes FR-78.

**Exit criteria:** Each remaining Should's demo passes, and cut items are removed from the scope notes before the freeze. W-77 passes its acceptance criteria.

**Planned dates:** Apr 1, 2027 to Apr 26, 2027.

| ID | Title (Jira) | Priority / type | Covers | Acceptance and tests | Depends on |
|---|---|---|---|---|---|
| W-66 | Rename saved deck<br>[OTCP-83](https://fillicianoplong.atlassian.net/browse/OTCP-83)<br>*Area:* Decks | Medium / Story (feature) | FR-39 | ☐ Given a saved deck, when I rename it, then the new name persists.<br>*Tests:* Unit: rename. | W-49 |
| W-67 | Download file name from deck name<br>[OTCP-84](https://fillicianoplong.atlassian.net/browse/OTCP-84)<br>*Area:* ExportCodec | Medium / Story (feature) | FR-30 | ☐ Given a deck name, when I download an export, then the file name comes from the deck name, made safe for file systems.<br>*Tests:* Unit: file name sanitizer. | W-46 |
| W-68 | Collection bulk import plain text<br>[OTCP-85](https://fillicianoplong.atlassian.net/browse/OTCP-85)<br>*Area:* Collection | Medium / Story (feature) | FR-68 | ☐ Given plain-text lines, when I bulk import them, then matching cards are added and bad lines are reported.<br>*Tests:* Unit: import parser. | W-53 |
| W-69 | Saved filter presets<br>[OTCP-86](https://fillicianoplong.atlassian.net/browse/OTCP-86)<br>*Area:* Search filters | Medium / Story (feature) | FR-59 | ☐ Given I am signed in, when I save a named filter preset, then I can reapply it later.<br>*Tests:* Unit: preset store. | W-24, W-38 |
| W-70 | Search table column prefs (covered by W-73)<br>[OTCP-87](https://fillicianoplong.atlassian.net/browse/OTCP-87)<br>*Area:* Search table | Medium / Story (feature) | FR-08 | ☐ Given the search Table, when I customize columns, then it behaves like the Lists and Collection tables from W-73, with any search-only follow-up done here.<br>*Tests:* E2E: search table customize and restore. | W-73 |
| W-77 | My value override per item<br>[OTCP-73](https://fillicianoplong.atlassian.net/browse/OTCP-73)<br>*Area:* ValueSummary, stores | High / Story (feature) | FR-78 | ☐ Given a collection or want-list item, when I set my value (nullable USD), then Current and P/L use my value times quantity.<br>☐ Given a deck, when a card matches a collection item with my value, then the deck uses it.<br>*Tests:* Unit: my value math; E2E: edit and see totals change. | W-75, W-76 |

### M10 Release (OTCP-11)

**Goal:** Public release with notes and docs that match what shipped.

**Exit criteria:** The release checklist is signed. README and doc versions are current. No Must bugs are open.

**Planned dates:** Apr 27, 2027 to May 7, 2027.

| ID | Title (Jira) | Priority / type | Covers | Acceptance and tests | Depends on |
|---|---|---|---|---|---|
| W-71 | Docs: Release notes and docs sync<br>[OTCP-88](https://fillicianoplong.atlassian.net/browse/OTCP-88)<br>*Area:* `docs/`, `README.md`, `CHANGELOG.md` | Medium / Task (docs) | NFR-17 | ☐ Given the release, when I write the notes, then they match the Must and Should features that shipped and list any Shoulds that were cut.<br>*Tests:* Doc review against the shipped features. | W-64, W-66 to W-70 (as kept) |
| W-72 | Public release checklist<br>[OTCP-89](https://fillicianoplong.atlassian.net/browse/OTCP-89)<br>*Area:* Repo settings, Pages, Supabase | High / Task (chore) | — | ☐ Given the release, when I run the checklist, then Pages deploys from Actions, production Supabase is set up, no Must bugs are open, and the release is tagged.<br>*Tests:* The signed checklist and a live-site smoke run. | W-71, W-14 |

## 5. Traceability

| Area | Requirements | Milestones |
|---|---|---|
| Search, filters, and views | FR-01 to FR-08, FR-56 to FR-60; NFR-01 | M0, M2, M3, M5, M7, M9 |
| Card detail and prices | FR-09 to FR-11, FR-44, FR-45 | M2, M3 |
| Formats | FR-12 to FR-20, FR-49 | M4, M6 |
| Decks, builder, and export | FR-21 to FR-31, FR-71 | M4, M5, M6, M9 |
| Accounts and saved decks | FR-32 to FR-40; NFR-04, NFR-06, NFR-07 | M5, M6, M8, M9 |
| Sharing | FR-41 to FR-43 | M7, M8 |
| Lists and collection | FR-61 to FR-70, FR-72 to FR-74 | M7, M9 |
| Value and condition | FR-75 to FR-78 | M7, M9 |
| Data pipeline and schema | FR-46 to FR-55; NFR-05, NFR-08 | M1, M2, M4, M8 |
| Quality: accessibility, performance, browsers, security | NFR-02, NFR-03, NFR-09 to NFR-16 | M0, M1, M8 |
| Docs and notices | NFR-17, NFR-18 | M0, M1, M8, M10 |

Every one of the 90 Must requirements (74 FRs and 16 NFRs) maps to at least one work item. There are no gaps.

**Must requirements to work items**

| Must | Work items | Must | Work items |
|---|---|---|---|
| FR-01 | W-20 | FR-48 | W-16 |
| FR-02 | W-20 | FR-49 | W-34 |
| FR-03 | W-20 | FR-50 | W-16 |
| FR-04 | W-23 | FR-51 | W-16 |
| FR-05 | W-24 | FR-52 | W-17 |
| FR-06 | W-27, W-73 | FR-53 | W-17 |
| FR-07 | W-27 | FR-54 | W-18 |
| FR-08 | W-70, W-73 | FR-55 | W-11 |
| FR-09 | W-19, W-29 | FR-56 | W-23, W-24 |
| FR-10 | W-29 | FR-57 | W-23, W-24 |
| FR-11 | W-29 | FR-58 | W-24 |
| FR-12 | W-31, W-36 | FR-60 | W-25, W-26, W-27, W-28, W-30, W-42 |
| FR-13 | W-31, W-33, W-36 | FR-61 | W-50 |
| FR-14 | W-31, W-45 | FR-62 | W-50, W-51 |
| FR-15 | W-31 | FR-63 | W-52 |
| FR-16 | W-35 | FR-64 | W-52 |
| FR-17 | W-35 | FR-65 | W-55, W-56 |
| FR-18 | W-34 | FR-66 | W-53 |
| FR-19 | W-34 | FR-67 | W-53 |
| FR-20 | W-32 | FR-69 | W-54 |
| FR-21 | W-43 | FR-70 | W-50 |
| FR-22 | W-43 | FR-71 | W-44 |
| FR-23 | W-45 | FR-72 | W-73 |
| FR-24 | W-45 | FR-73 | W-73 |
| FR-25 | W-45 | FR-74 | W-73 |
| FR-26 | W-35, W-45 | FR-75 | W-74 |
| FR-27 | W-39, W-48 | FR-76 | W-51, W-75 |
| FR-28 | W-46 | FR-77 | W-76 |
| FR-29 | W-46 | FR-78 | W-75, W-77 |
| FR-31 | W-46, W-47 | NFR-01 | W-03, W-20 |
| FR-32 | W-38 | NFR-02 | W-59 |
| FR-33 | W-38 | NFR-03 | W-14, W-62 |
| FR-34 | W-38 | NFR-04 | W-37, W-62 |
| FR-35 | W-41 | NFR-05 | W-18, W-62 |
| FR-36 | W-39, W-40 | NFR-06 | W-37, W-62 |
| FR-37 | W-49 | NFR-07 | W-41, W-62 |
| FR-38 | W-40 | NFR-08 | W-17 |
| FR-40 | W-49 | NFR-09 | W-58 |
| FR-41 | W-56, W-57 | NFR-10 | W-58 |
| FR-42 | W-56, W-57 | NFR-11 | W-58 |
| FR-43 | W-65 | NFR-12 | W-12, W-60 |
| FR-44 | W-21 | NFR-14 | W-02, W-63 |
| FR-45 | W-21, W-22 | NFR-16 | W-15, W-60 |
| FR-46 | W-16 | NFR-17 | W-01, W-08, W-71 |
| FR-47 | W-17 | NFR-18 | W-06, W-13, W-61 |

**Should requirements to work items**

| Should | Work items |
|---|---|
| FR-30 | W-67 |
| FR-39 | W-66 |
| FR-59 | W-69 |
| FR-68 | W-68 |
| NFR-13 | W-10 |
| NFR-15 | W-02, W-63 |

## 6. Definition of done

**Plan level.** The plan is done when:

- every work item meets its item-level definition of done;
- CI is green on main (typecheck, lint, format, unit tests, license check, and the Chromium smoke test);
- the site deploys to GitHub Pages from GitHub Actions on every push to main;
- the browser bundle contains no Supabase service role key or other secret (ADR-006);
- every spike finding is recorded, and each UNVERIFIED claim is verified or deferred with my approval;
- `docs/SRS.md`, `docs/ARCHITECTURE.md`, `docs/UI.md`, this plan, and the README carry versions that match what shipped.

**Item level.** Every Jira Story ends with this definition of done, word for word:

1. All acceptance criteria are checked.
2. Unit tests, typecheck, lint, and the Playwright smoke test pass in CI.
3. It works on the live site on desktop and phone.
4. It lands in one commit on main.

Every Task (spikes, chores, docs, tests, security, and packaging) ends with this one:

1. All steps are checked.
2. CI passes.
3. It lands in one commit on main.

## 7. Risks

| ID | Risk | Likelihood | Impact | Plan mitigation |
|---|---|---|---|---|
| R-01 | Client search or facet-count refresh misses the 100 ms target on the reference phone | Medium | High | W-03 runs before M3; fallbacks per ADR-009 and ADR-012. |
| R-02 | Supabase free-tier quotas block auth or deck saves | Medium | High | W-04 records the limits; paid tier or fewer shares if needed. |
| R-03 | Goat / HAT / Tengu banlist snapshots are incomplete or disputed | Medium | Medium | W-05 cites sources; W-33 marks disputed rows. |
| R-04 | An npm dependency license is incompatible with the Notices page | Low | Medium | W-06 scans licenses; W-61 replaces any bad package before Notices is final. |
| R-05 | Skill card placement differs across Speed Duel decks in the wild | Medium | Medium | W-07 checks a corpus; W-46 follows the YGOPRODeck rule. |
| R-06 | YGOPRODeck rate limits, schema drift, or ToS change break refresh | Medium | High | W-17 validation fails closed and keeps the prior data live. |
| R-07 | GitHub Pages + Supabase auth redirect or CSP misconfiguration | Medium | High | W-04 proves sign-in on the real `/otcp/` origin; W-38 repeats it. |
| R-08 | Share tokens are too short or leaked in Referer headers | Low | High | W-57 uses 128-bit tokens, hash-only storage, and a Referrer-Policy; W-65 adds revoke. |
| Setup | The Pages source is still set to deploy from a branch. | Medium | Medium | I set it to GitHub Actions in the repo settings before W-14 is done. |

## 8. Tracker setup

The Epics and work items are created in Jira project OTCP once this plan is approved.

| Plan idea | In Jira |
|---|---|
| Milestone M0 to M10 | Epic OTCP-1 to OTCP-11, named after the milestone, with its goal and exit criteria, and planned start and due dates. |
| Work item W-xx | A Story (feature) or Task (spike, chore, docs, test, security, packaging) under its Epic, with the W-ID in its description. |
| Priority | Jira Priority field: Must is High, Should is Medium, Could is Low. |
| FR and NFR IDs | The Requirements line in the Details section. |
| Acceptance criteria | A checklist in the description (Steps on a Task). |
| Definition of done | The numbered list at the end of every description, as in section 6. |
| Depends on | A blocks link only for a real dependency; otherwise relates to. |
| Fixed in | Bugs found later name the version and link the commit that fixed them. |
| Labels | Only where Jira has no field for the idea. |

The Jira key for every work item is in its row in section 4.

## 9. Decisions and open questions

| ID | Decision | Outcome |
|---|---|---|
| D-01 | Definition of done | Accepted 2025-12-27, as in section 6. |
| D-02 | FR-43 share revoke priority | Decided 2025-12-27: FR-43 is Must. W-65 is in M8, so AC-08 passes in full there. |
| D-03 | Table view on desktop Lists and Collection | Decided 2025-12-27: add Table on desktop Lists and Collection, as well as search. |
| D-04 | Field used for list totals (FR-62) | Decided 2025-12-27: the TCGplayer price from the published price snapshot. |
| D-05 | Customizable tables and purchase price | Decided 2025-12-27: FR-72 to FR-75 and UI-D10, built as W-73 and W-74. |
| D-06 | Value summary, condition, and my value | Decided 2025-12-27: FR-76 to FR-78 and UI-D11, built as W-75 to W-77. |
| D-07 | Milestone dates | Planned start and due dates go on the Epics only. |
| D-08 | When to freeze Must scope | At the end of M8, before any Should is cut. W-77 is the one Must item still open in M9. |
| D-09 | Link marker size (UI-P1) | Keep 16 CSS px through M8; revisit as polish after M8 if needed. |

**Open questions**

- The Pages source has to be switched to GitHub Actions in the repo settings before M1 can exit. I will do that by hand.
- The Jira Epics and items are created only after this plan is approved.

## 10. Files

| Path | What |
|---|---|
| `docs/IMPLEMENTATION_PLAN.md` | This plan (Markdown). |
| `docs/Plong_OTCP_Implementation_Plan.docx` | This plan (Word). |
| `docs/out/Plong_OTCP_Implementation_Plan.pdf` | This plan (PDF). |
| `docs/SRS.md`, `docs/ARCHITECTURE.md`, `docs/UI.md` | The approved inputs, each with Word and PDF copies. |
