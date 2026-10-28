# OTCP implementation plan (1.0)

Prepared by: Filliciano Plong · Date: October 28, 2026 · Version: 1.0

**Readers:** Filliciano Plong, developer and tester of OTCP. Status: Approved 2026-10-28. Creating GitHub issues, milestones, labels, or pull requests still requires a separate explicit go.

## Inputs

| Input | Version or state |
|---|---|
| docs/SRS.md | 1.0 Approved (78 FRs: 72 Must, 6 Should; 18 NFRs: 16 Must, 2 Should; AC-01 to AC-23) |
| docs/ARCHITECTURE.md | 1.0 Approved (components, ADR-001..013, spikes S-01..S-05, risks R-01..R-08) |
| docs/UI.md | 1.0 Approved 2026-10-28 (Ink; Stack V1 Mono charcoal; List/Grid/Table; customizable Lists/Collection tables UI-D10; value summary UI-D11) |
| docs/pending_edits.md | Private decisions log; UI 1.0 folds recorded 2026-10-28 |
| Repository | fillicianoplong/otcp — foundation PR #1 open (Vite 7, React 19, TypeScript, Tailwind 4, Vitest, Playwright); no product source yet beyond the PR stack |
| Definition of done | Accepted (D-01) 2026-10-28 — stated below |

## How to read this plan

Items are numbered W-01 to W-77 in build order. Each item is one pull request where possible.
Priority labels follow the SRS: Must = `priority:high`, Should = `priority:medium`, Could = `priority:low`. The SRS has no Could items. A spike or chore takes the priority of the highest item it unblocks.

M0 runs first: repository chores and architecture spikes S-01..S-05. M1 produces a runnable shell on GitHub Pages under `/otcp/`. Every Must is done by M8 (including share revoke per D-02); M9 holds the remaining Shoulds in reverse drop order; M10 is the public release.

### Definition of done (D-01)

An item is done when: its checklist is ticked; its tests are in the repo and pass in CI; typecheck and lint pass; the browser bundle never embeds the Supabase service role key or other secrets (ADR-006); any UNVERIFIED item it settles has a proposed doc edit; and it merges as one PR that names `Closes #N`.

**Done when:** checklist ticked; tests, typecheck, and lint pass in CI; no service_role (or other secret) in the client bundle; any UNVERIFIED item settled has a proposed doc edit; work lands in one PR.

## Outstanding repository chores (before or with M0)

These are not optional; they unblock a clean merge of PR #1 and Pages hosting.

| Chore | Owner | Note |
|---|---|---|
| Attach an **M1 issue** to PR #1 (`Closes #N`) | Filliciano after plan approval (issue created only then) | Every PR needs an issue first (Obelisk playbook). |
| Add a **pull request template** under `.github/PULL_REQUEST_TEMPLATE.md` | Planned as W-01 | Require issue link, checklist, and test notes. |
| Fix the **README roadmap** so it matches this plan’s milestones | Planned as W-01 | Status line and doc version labels stay current after each edit. |
| Set the GitHub **Pages source to GitHub Actions** | **Filliciano (manual in repo Settings → Pages)** | Required for the deploy workflow in M1; cannot be done from a PR alone. |

**This draft does not create issues, labels, milestones, or PRs, and does not push.**

## Milestones

| Milestone | Goal | Exit criteria | Items | High | Medium |
|---|---|---|---|---|---|
| **M0 Setup and spikes** | Repo chores done; spikes S-01..S-05 answered before features that depend on them. | PR template and README roadmap landed; each spike has a findings note under `spikes/` with pass/fail and fallback; proposed doc edits drafted for any settled UNVERIFIED claim. | W-01 to W-08 (8) | 7 | 1 |
| **M1 Runnable shell** | Vite/React app deploys to `/otcp/` with Ink chrome, Stack favicon, and CI. | `npm start` opens Home; Actions build + Pages deploy succeed once Pages source is Actions; Stack V1 favicon ships; smoke test passes in Chromium. | W-09 to W-15 (7) | 7 | 0 |
| **M2 Card data and search** | Published card JSON + same-origin art; typed name/passcode search. | AC-01 (search latency target recorded); AC-10/AC-11 for refresh and image origin; schema validates. | W-16 to W-22 (7) | 7 | 0 |
| **M3 Filters and views** | Faceted filters; List/Grid/Table (search, Lists, Collection); card detail with official icons. | AC-02 and AC-03; AC-19; UI screens Search / Results / Detail / Lists·Table / Collection·Table. | W-23 to W-30 (8) | 8 | 0 |
| **M4 Formats** | Format catalog, banlists, Genesys, Speed Duel rules. | AC-04, AC-16, AC-17, AC-18 (rules half); Formats screens. | W-31 to W-36 (6) | 6 | 0 |
| **M5 Auth and saved decks** | Supabase auth; guest drafts; signed-in save/load/delete account. | AC-07; Account screen; guest→sign-in import prompt (QS-04). | W-37 to W-42 (6) | 6 | 0 |
| **M6 Deck builder and export** | Builder with CardFinder; live validation; YDK/YDKE/Mass Entry/text. | AC-05, AC-06; Decks + builder screens. | W-43 to W-49 (7) | 7 | 0 |
| **M7 Lists and collection** | Lists, collection, owned/missing, list share, customizable tables, purchase price, value summary, condition. | AC-20, AC-21 (minus FR-68), AC-22, AC-23; Lists / Collection screens. | W-50 to W-56, W-73 to W-76 (11) | 11 | 0 |
| **M8 Must complete** | Deck share (incl. revoke), a11y, performance, Notices, cross-browser: every Must done. | AC-08 full (create/open/revoke), AC-09, AC-12..AC-15; all Must ACs pass. | W-57 to W-65 (9) | 9 | 0 |
| **M9 Should features** | Remaining Shoulds in reverse SRS drop order (last built = first cut). | Each remaining Should’s demo passes; cut items removed from scope notes before freeze. | W-66 to W-70, W-77 (6) | 0 | 6 |
| **M10 Release** | Public release notes and docs match what shipped. | Release checklist signed; README and docs versions current; no open Must bugs. | W-71 to W-72 (2) | 2 | 0 |

**Totals:** 77 items: 70 priority:high, 7 priority:medium, 0 priority:low.
(High includes Musts plus spikes/chores that unblock Musts, including W-65 revoke after D-02 and W-73..W-76. Medium = remaining Shoulds W-66..W-70, W-77 plus spike W-05.)

## Work items

### M0 Setup and spikes

Repo chores and architecture spikes before product features.

| ID | Title | Label | Covers | UI / area | Acceptance | Depends on |
|---|---|---|---|---|---|---|
| W-01 | PR template, README roadmap, issue hygiene notes | high / chore | NFR-17 | `.github/PULL_REQUEST_TEMPLATE.md`, `README.md` | Template requires issue link + checklist; README milestones match this plan; note that Pages source → Actions is Filliciano-only. | — |
| W-02 | CI: typecheck, lint, unit, Chromium Playwright smoke | high / test | NFR-14, NFR-15 | `.github/workflows/ci.yml`, Vitest, Playwright | CI fails on a planted failing test; passes on green main. | W-01 |
| W-03 | Spike S-01: search + facet recount latency | high / spike | QS-01, R-01, ADR-009, ADR-012 | `spikes/s01/` | Findings README: device, build, timings, pass/fail, chosen fallback if fail. | W-02 |
| W-04 | Spike S-02: Supabase auth on `/otcp/` + CSP | high / spike | ADR-006, R-02, R-07 | `spikes/s02/` | Email + Google sign-in from real Pages origin; limits noted. | W-02 |
| W-05 | Spike S-03: Goat / HAT / Tengu banlist snapshots | medium / spike | ADR-004, R-03 | `spikes/s03/` | Snapshot files + gap list; disputed cards flagged. | — |
| W-06 | Spike S-04: npm license scan on PR #1 lockfile | high / spike | NFR-18, R-04 | `spikes/s04/` | License inventory; non-permissive packages listed for Notices. | W-02 |
| W-07 | Spike S-05: Speed Duel Skill ids in public YDK | high / spike | ADR-010, R-05 | `spikes/s05/` | Corpus result: Skill under `#main` confirmed or fallback documented. | — |
| W-08 | Record spike results; draft doc edits | high / docs | NFR-17 | `docs/drafts/`, `spikes/s0N/README.md` | Every settled UNVERIFIED has a proposed SRS/Arch edit with the spike as source. | W-03..W-07 |

### M1 Runnable shell

A secure static SPA shell on GitHub Pages under `/otcp/`.

| ID | Title | Label | Covers | UI / area | Acceptance | Depends on |
|---|---|---|---|---|---|---|
| W-09 | Scaffold Vite 7 + React 19 + TS + Tailwind 4 | high / feature | OD-04, ADR-001 | `package.json`, `vite.config`, `src/` | `npm start` serves app at base `/otcp/`; Node 22 pinned. | W-02 |
| W-10 | Ink tokens + Match system theme | high / feature | NFR-13, UI-D1, UI-D3 | `src/styles/`, `docs/ui/tokens.css` wired via Tailwind `@theme` | Light/dark follow `prefers-color-scheme` and `data-theme`; contrast pairs match `contrast.txt`. | W-09 |
| W-11 | Stack V1 Mono charcoal favicon + manifest | high / feature | UI-D6 | `public/`, PWA/manifest icons | Favicon and 192/512 icons are V1 `#1A1A1A` Stack. | W-09 |
| W-12 | AppShell: routes, desktop nav, phone hamburger | high / feature | UI-D4, Screen map | AppShell | Nav: Search, Formats, Decks, Collection, Lists, Account; no Builder primary route; 375 and 1280 layouts. | W-10 |
| W-13 | Notices page stub + license placeholder | high / docs | NFR-18 | Notices screen | Page lists stack licenses (filled after S-04). | W-12, W-06 |
| W-14 | Pages deploy workflow (Actions artifact) | high / packaging | OD-09, ADR-001 | `.github/workflows/pages.yml` | Workflow builds and uploads Pages artifact; **Filliciano sets Pages source to GitHub Actions**. | W-09 |
| W-15 | Smoke e2e: home loads under `/otcp/` | high / test | NFR-16 | Playwright | Chromium: `/otcp/` returns 200 shell with nav landmarks. | W-12, W-14 |

### M2 Card data and search

| ID | Title | Label | Covers | UI / area | Acceptance | Depends on |
|---|---|---|---|---|---|---|
| W-16 | SchemaCore: versioned core + Yu-Gi-Oh! extension | high / feature | FR-46, FR-48, FR-51, AC-15 | `packages/schema` or `src/shared/schema` | Valid fixtures pass; unknown/required-field failures fail tests. | W-09 |
| W-17 | DataPipeline: fetch, validate, publish pointer | high / feature | FR-52, FR-53, NFR-08, AC-10, QS-03 | `pipeline/`, Actions workflow | Invalid record keeps prior pointer; success swaps atomically. | W-16 |
| W-18 | Re-host card images same-origin | high / feature | FR-54, NFR-05, AC-11 | pipeline image step | Network capture on 20 cards: no `images.ygoprodeck.com`. | W-17 |
| W-19 | CardCatalog loads published JSON | high / feature | FR-09 | CardCatalog, Home/Search | Home shows cards after index load; empty/error states. | W-17, W-12 |
| W-20 | SearchIndex: typed name + passcode | high / feature | FR-01, FR-02, FR-03, NFR-01, AC-01 | SearchIndex | Unique substring and passcode find the card; latency recorded vs S-01. | W-19, W-03 |
| W-21 | Price fields on detail from published snapshot | high / feature | FR-44, FR-45, AC-09 (data half) | PriceView | Detail shows TCGplayer / CSI / Cardmarket snapshot fields. | W-19 |
| W-22 | Store deep links open new tab | high / feature | FR-45, ADR-008 | PriceView | Each store control opens third-party tab; no API scrape. | W-21 |

### M3 Filters and views

| ID | Title | Label | Covers | UI / area | Acceptance | Depends on |
|---|---|---|---|---|---|---|
| W-23 | FilterEngine + facet declarations | high / feature | FR-04, FR-56, FR-57, ADR-012 | FilterEngine | Core + game facets; include/exclude; AND/OR; Node unit tests. | W-16, W-03 |
| W-24 | Facet UI: desktop sidebar + phone Filters sheet | high / feature | FR-56..59 (UI), UI screens | Search / Filters | Live counts; chips; Clear all; See N results on phone. | W-23, W-19 |
| W-25 | List view with official icons + ban markers | high / feature | FR-60, UI List | Search results | List row: thumbnail, YGO icons, ATK/DEF badges, format-gated ban. | W-19, W-20 |
| W-26 | Grid view (≥3 cols on phone) | high / feature | FR-60 | Search results | Grid art + overlays; ≥3 columns at 360–430 CSS px. | W-25 |
| W-27 | Table view on search, Lists, and Collection (desktop ≥~640) | high / feature | FR-06, FR-07, FR-60, UI-D9 | Results / Table; Lists · Table; Collection · Table | Sortable columns on search, Lists, and Collection; hidden under ~640; List/Grid remain. LC defaults and customize land in W-73. | W-25 |
| W-28 | View preference persistence | high / feature | FR-60, AC-19 | AppShell | localStorage (and later profile); defaults Grid for search desktop. | W-26, W-27 |
| W-29 | Card detail stacked phone / two-column desktop | high / feature | FR-09..11, AC-03 | Detail | Same-origin art; ban matches format; labeled chips. | W-19 |
| W-30 | Official icon assets + SOURCES.md wiring | high / feature | FR-60, ICON-01 | `public/icons/`, baked assets | List/detail use approved baked icons; Link marker 16 px (UI-P1 polish later). | W-25 |

### M4 Formats

| ID | Title | Label | Covers | UI / area | Acceptance | Depends on |
|---|---|---|---|---|---|---|
| W-31 | Format catalog + Advanced / Traditional | high / feature | FR-12, FR-13, FR-15 | FormatEngine, Formats | Select format; pool and ban status apply. | W-23 |
| W-32 | Edison curated snapshot | high / feature | FR-20, AC-04 | Formats | Post-Edison cards absent; Forbidden cannot add. | W-31, W-05 |
| W-33 | Goat / HAT / Tengu from S-03 | high / feature | FR-13, R-03 | Formats | Snapshots load; gaps documented. | W-31, W-05 |
| W-34 | Genesys points + caps | high / feature | FR-18, FR-19, FR-49, AC-17 | FormatEngine, Builder (rules) | Refuse Links; default cap 100; custom cap; over-cap flag; Konami diff report on refresh. | W-31, W-17 |
| W-35 | Speed Duel pool + Skill rules | high / feature | FR-16, FR-17, FR-26, AC-18 | FormatEngine | Refuse non-Speed; one Skill; Main max 30. | W-31, W-07 |
| W-36 | Formats gallery screens | high / feature | Screen map Formats | Formats UI | Browse formats and banlists List/Grid. | W-32..W-35 |

### M5 Auth and saved decks

| ID | Title | Label | Covers | UI / area | Acceptance | Depends on |
|---|---|---|---|---|---|---|
| W-37 | Supabase project wiring + RLS migrations | high / security | ADR-006, ADR-013 | `supabase/` | Tables + RLS as Architecture §6.11; anon key only in client. | W-04 |
| W-38 | AuthClient: email/password + Google | high / feature | FR-32, OD-06 | Account | Sign-up, sign-in, sign-out on `/otcp/` origin. | W-37, W-12 |
| W-39 | Guest deck drafts in browser storage | high / feature | FR-27, FR-36 | DeckStore | Guest builds persist locally; Save/Share require sign-in. | W-12 |
| W-40 | Signed-in deck save / load | high / feature | FR-36, FR-38, QS-04 | DeckStore, Decks | Cross-browser load; guest import prompt once; decline sticky. | W-38, W-39 |
| W-41 | Account deletion (hard delete live data) | high / security | FR-35, NFR-07, QS-06, AC-07 | Account | Cannot sign in; decks/lists/collection/shares gone immediately. | W-40 |
| W-42 | Profile view preference sync | high / feature | FR-60 | AppShell, profile | Signed-in preference syncs; guests stay localStorage-only. | W-28, W-38 |

### M6 Deck builder and export

| ID | Title | Label | Covers | UI / area | Acceptance | Depends on |
|---|---|---|---|---|---|---|
| W-43 | DeckBuilder shell from Decks | high / feature | FR-21, FR-22 | DeckBuilder | Main/Extra/Side (+ Skill); opened from Decks only. | W-40, W-31 |
| W-44 | CardFinder shared control | high / feature | FR-71, UI-D8 | CardFinder | Search-add in deck, list, and collection editors. | W-20, W-43 |
| W-45 | Live deck validation | high / feature | FR-23..26, AC-04/16/17/18 | DeckBuilder | Ban and format rules refuse illegal adds. | W-43, W-34, W-35 |
| W-46 | ExportCodec: YDK / YDKE / Mass Entry / text | high / feature | FR-28, FR-29, FR-31, AC-06 | ExportCodec | Round-trip Speed YDK recovers Skill under `#main`. | W-43, W-07 |
| W-47 | Import YDK | high / feature | FR-31 | ExportCodec, Decks | Import builds deck; invalid file refused safely. | W-46 |
| W-48 | Guest export without account | high / feature | FR-27, AC-05 | Decks | Guest exports; Save/Share gated. | W-46, W-39 |
| W-49 | Deck list screen (saved + drafts) | high / feature | Screen map Decks | Decks | List saved decks; open builder; empty states. | W-40, W-43 |

### M7 Lists and collection

| ID | Title | Label | Covers | UI / area | Acceptance | Depends on |
|---|---|---|---|---|---|---|
| W-50 | WantListStore + Lists CRUD | high / feature | FR-61, FR-62, FR-70 | Lists | Named lists; qty; set/rarity; note; guest browser / signed-in Supabase. | W-37, W-12 |
| W-51 | List market totals via ValueSummary | high / feature | FR-62, FR-76 | Lists / ValueSummary | Market totals from card_prices.tcgplayer_price × qty live in the value summary bar (not the count line). | W-50, W-21, W-75 |
| W-52 | Check-off adds to collection | high / feature | FR-64 | Lists / Collection | Check-off moves/adds owned printing; optional copy of want-list purchase_price onto the collection item. | W-50, W-53 |
| W-53 | CollectionStore + add from search/detail/deck | high / feature | FR-66, FR-67 | Collection | Qty + printing; Table default on desktop; compact icon rows on phone. | W-37, W-29 |
| W-54 | Owned/missing in deck builder | high / feature | FR-69, AC-21 | DeckBuilder | Shows owned vs missing; add missing to a list. | W-53, W-43, W-50 |
| W-55 | List export Mass Entry + plain text | high / feature | FR-65 | Lists | Export matches reference formats. | W-50 |
| W-56 | List share create + read-only page | high / feature | FR-65, FR-41/42 (lists) | ShareService, Lists | Signed-in create; guest read-only; sign-in required to share. | W-50, W-38 |


| W-73 | Shared DataTable + ColumnConfigStore (Search/Lists/Collection) | high / feature | FR-06, FR-72, FR-73, FR-74, UI-D9, UI-D10, AC-22 | DataTable, ColumnConfigStore, AppShell | **Table is default desktop view** on Search, Lists, Collection (≥~640); phone uses compact icon rows (no Table). Defaults Name/Qty/Set/Rarity/Condition/Purchase/Market on Lists & Collection (search defaults per table-columns ref). Header menu + Columns; sort; per-column filter; drag-reorder; resize; **restore full setup on reopen** via localStorage + profiles.table_column_prefs. Shared live count line (card count only, same format as Search). | W-27, W-37 |
| W-74 | Purchase price field on collection and list items | high / feature | FR-75 | CollectionStore, WantListStore, schema | `purchase_price` = what the user paid (USD nullable) on collection_items and want_list_items; editable in editors and table. Check-off may optionally copy purchase onto the collection item. Decks inherit purchase from matching collection printings (no per-deck-entry price). | W-50, W-53, W-37 |
| W-75 | Value summary bar (current / paid / P/L) | high / feature | FR-76, FR-78, UI-D11, AC-23 | ValueSummary | On Collection, each List, each Deck: Current (market×qty or my_value×qty when set), Paid, P/L over priced items, “N of M priced”. Prices/P/L appear **only** here — toolbar count line is card count only (matches Search). Decks inherit purchase/my_value from collection matches. | W-74, W-51, W-43 |
| W-76 | Condition and variant flags on items | high / feature | FR-77 | CollectionStore, WantListStore, DeckBuilder, DataTable | Condition NM/LP/MP/HP/DMG; EU / 1st / faded flags + note; Condition default-on Collection table; variants addable. Market price not auto-adjusted. | W-74, W-73 |
| W-77 | my_value override per item (Must) | high / feature | FR-78 (Must) | ValueSummary, stores | Optional my_value (USD nullable) on collection and want-list items; when set, Current and P/L use my_value×qty; decks inherit from collection matches. | W-75, W-76 |

### M8 Must complete

| ID | Title | Label | Covers | UI / area | Acceptance | Depends on |
|---|---|---|---|---|---|---|
| W-57 | Deck share create + read-only view | high / feature | FR-41, FR-42, AC-08, R-08 | ShareService | Opaque token; read-only; Referrer-Policy; ≥128-bit entropy. | W-40 |
| W-58 | Accessibility pass (WCAG 2.2 AA) | high / test | NFR-09..11, AC-13, QS-07 | AppShell primary screens | Keyboard UC-01/05/06; axe clean; ban not color-only. | W-24, W-43, W-29 |
| W-59 | Performance: first load ≤2 s target | high / test | NFR-02, AC-12, QS-02 | AppShell | Measurement method + device recorded. | W-19, W-14 |
| W-60 | Cross-browser smoke | high / test | NFR-12, NFR-16, AC-14 | e2e | UC-01 and UC-05 on Chrome, Firefox, Safari, Edge (desktop + one mobile engine where available). | W-43, W-24 |
| W-61 | Notices page final licenses | high / docs | NFR-18 | Notices | Matches S-04 inventory; no incompatible license left unexplained. | W-13, W-06 |
| W-62 | Security review fixes from docs/reviews | high / security | NFR-03..07 | CSP, RLS, shares | Checklist from security-review.md closed or deferred with owner note. | W-37, W-57 |
| W-63 | Schema/export unit coverage gate | high / test | NFR-14, NFR-15 | CI | Coverage thresholds for schema + ExportCodec met. | W-16, W-46 |
| W-64 | Must AC regression pack | high / test | AC-01..21 Must paths | `tests/` | All Must acceptance criteria automated or demo-scripted and green. | W-57..W-63, W-65 |
| W-65 | Revoke share link | high / feature | FR-43 (Must per D-02) | ShareService | After revoke, old URL fails; AC-08 full in M8. | W-57 |

### M9 Should features

Build in **reverse SRS drop order** so the first cut is the last built. (FR-43 removed from drop list — now Must.)

| ID | Title | Label | Covers | UI / area | Acceptance | Depends on |
|---|---|---|---|---|---|---|
| W-66 | Rename saved deck | medium / feature | FR-39 | Decks | Rename persists; export name unchanged unless FR-30 ships. | W-49 |
| W-67 | Download file name from deck name | medium / feature | FR-30 | ExportCodec | Sanitized filename from deck name. | W-46 |
| W-68 | Collection bulk import plain text | medium / feature | FR-68 | Collection | Lines import; bad lines reported. | W-53 |
| W-69 | Saved filter presets | medium / feature | FR-59 | Search / Filters | Signed-in save/reapply named presets. | W-24, W-38 |
| W-70 | Search table column prefs (covered by W-73) | high / feature | FR-08 (Must) | Results / Table | Same DataTable customize as Lists/Collection (REC-TABLE-01 folded). Prefer implementing via W-73; keep W-70 only if search needs a thin follow-up. | W-73 |

### M10 Release

| ID | Title | Label | Covers | UI / area | Acceptance | Depends on |
|---|---|---|---|---|---|---|
| W-71 | Release notes + docs sync | high / docs | NFR-17 | `docs/`, README | Notes match shipped Must/Should set; cut Shoulds listed. | W-64, W-66..W-70 (as kept) |
| W-72 | Public release checklist | high / chore | — | Repo Settings, Pages, Supabase | Pages on Actions; prod Supabase; no Must bugs open; tag release. | W-71, W-14 |

## Traceability (summary)

| Area | Primary FRs / NFRs | Primary UI screens | Milestone |
|---|---|---|---|
| Search + filters + views | FR-01..08, FR-56..60; NFR-01 | Search, Results/Table, Lists·Table, Collection·Table, Filters | M2–M3 |
| Detail + prices | FR-09..11, FR-44..45 | Detail | M2–M3 |
| Formats | FR-12..20, FR-49 | Formats | M4 |
| Decks + builder + export | FR-21..31, FR-71 | Decks, Builder (from Decks) | M5–M6 |
| Accounts + saved decks | FR-32..40; NFR-04, NFR-07 | Account, Decks | M5 |
| Sharing | FR-41..43; R-08 | Share view | M8 (incl. revoke) |
| Lists + collection | FR-61..70, FR-72..77 (FR-62 = tcgplayer_price); FR-78 Should | Lists, Collection (+ customizable Table); ValueSummary | M7 |
| Value / condition | FR-75..77 (Must), FR-78 Should | ValueSummary; item editors | M7 / M9 |
| Data pipeline | FR-46..54; NFR-05, NFR-08 | — (Actions) | M2 |
| A11y / perf / browsers | NFR-02, NFR-09..16 | Primary screens | M8 |

No Must FR or Must NFR is left without a work item. Remaining Shoulds map to W-66..W-70 and W-77. FR-43 revoke is W-65 in M8. FR-72..77 → W-73..W-76.

## Definition of Done (plan-level)

1. Every merged item meets D-01.
2. CI green on `main` (typecheck, lint, unit, Chromium smoke).
3. Pages deploy from GitHub Actions; Filliciano has set Pages source to Actions.
4. Client bundle contains no service_role or other secrets.
5. Spike findings filed; UNVERIFIED claims either verified or explicitly deferred with owner approval.
6. docs/SRS.md, ARCHITECTURE.md, UI.md, and this plan’s version labels match what shipped.

## Risks

| ID | Risk | Plan mitigation |
|---|---|---|
| R-01 | Search / facet latency miss | W-03 before M3; fallbacks per ADR-009 (not a view-library swap) |
| R-02 | Supabase free-tier caps | W-04; document limits; paid tier or cut share volume |
| R-03 | Incomplete Goat/HAT/Tengu | W-05; cite sources; mark disputed |
| R-04 | Bad npm license | W-06; replace package before Notices final |
| R-05 | Skill placement variance | W-07; document YGOPRODeck rule |
| R-06 | Upstream drift / ToS | Pipeline validation fails closed (W-17) |
| R-07 | Pages auth / CSP | Proven in W-04 on real `/otcp/` |
| R-08 | Share token leakage | W-57 entropy + hash storage + Referrer-Policy |
| Chore | Pages source still “Deploy from branch” | Filliciano sets Actions before W-15 is considered done |
| Chore | PR #1 merges without an issue | W-01 + owner creates M1 issue at approval time |

## GitHub issues and labels that WOULD be created

**Not created by this draft.** After plan approval, create:

### Labels (10)

| Label | Use |
|---|---|
| `priority:high` | Must items; spikes/chores that unblock a Must |
| `priority:medium` | Should items |
| `priority:low` | Could (none in SRS 1.0) |
| `type:feature` | Product behavior |
| `type:spike` | S-01..S-05 |
| `type:chore` | Repo hygiene, release checklist |
| `type:test` | CI, a11y, perf, regression packs |
| `type:security` | Auth, RLS, CSP, share tokens |
| `type:packaging` | Pages deploy, artifacts |
| `type:docs` | Notices, release notes, spike doc drafts |

### Milestones (11)

`M0 Setup and spikes`, `M1 Runnable shell`, `M2 Card data and search`, `M3 Filters and views`, `M4 Formats`, `M5 Auth and saved decks`, `M6 Deck builder and export`, `M7 Lists and collection`, `M8 Must complete`, `M9 Should features`, `M10 Release`.

### Issues

One issue per W-01..W-77. Title = item title. Body format (Obelisk playbook):

1. **Why** (one or two sentences)
2. **Covers** (FR/NFR/AC/UI IDs)
3. **Work** (files/area bullets)
4. **Acceptance** (checklist)
5. **Notes** (dependencies, UNVERIFIED, fallbacks)
6. **Done when:** checklist ticked; tests, typecheck, and lint pass in CI; no service_role (or other secret) in the client bundle; any UNVERIFIED item settled has a proposed doc edit; work lands in one PR.

Each issue: one priority label, one type label, one milestone. PRs say `Closes #N`.

Also at approval time: file the **M1 issue** that PR #1 will close.

## Decisions for the owner

| ID | Decision | Why needed | Recommended default |
|---|---|---|---|
| D-01 | Definition of done | None in the docs | **Accepted** 2026-10-28 — as proposed above |
| D-02 | FR-43 share revoke priority | AC-08 / OD-07 need revoke | **Decided** 2026-10-28 — FR-43 is **Must**; W-65 moved into M8; AC-08 full in M8 |
| D-03 | REC-WL-01 — Table on Lists / collection desktop? | View-mode scope | **Decided** 2026-10-28 — **ADD** Table on desktop Lists and Collection (with search); fold UI/SRS/Arch 1.0 |
| D-09 | Customizable Lists/Collection tables + purchase price | Filliciano 2026-10-28 | **Decided** — FR-72..75; UI-D10; W-73, W-74 |
| D-10 | Value summary + condition/variants on Collection, Lists, Decks | Filliciano 2026-10-28 | **Decided** — FR-76..77 Must, FR-78 Should; UI-D11; W-75, W-76, W-77; open REC-TABLE-01/02, REC-VALUE-01/02 |
| D-04 | REC-WL-02 — list total price field | FR-62 | **Decided** 2026-10-28 — `card_prices.tcgplayer_price` (TCGplayer) |
| D-05 | Milestone due dates | None given | Leave empty until plan approval |
| D-06 | Type labels | Playbook proposes them | **Accepted** 2026-10-28 — keep the ten labels above |
| D-07 | When to freeze “no more Must scope” | Release hygiene | End of M8 before M9 Should cuts |
| D-08 | UI-P1 Link marker size | Deferred polish | Keep 16 CSS px through M8; optional polish issue after M8 if needed |

## Open questions needing Filliciano’s decision

1. Confirm **Pages source → GitHub Actions** will be set before M1 exit.
2. Confirm creation of milestones, labels, and issues W-01..W-77 (separate explicit go — plan approval alone does not create them).

## Files

| Path | What |
|---|---|
| `docs/IMPLEMENTATION_PLAN.md` | This plan (1.0 Approved) |
| `docs/Plong_OTCP_Implementation_Plan.docx` / `.pdf` | House-style copies |

## Revision history

| Version | Date | Changes |
|---|---|---|
| 1.0 | October 28, 2026 | Approved by Filliciano Plong. First release of the implementation plan. |

**Status:** Approved 2026-10-28 by Filliciano Plong. Version 1.0.
