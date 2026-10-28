# UI specification: OTCP

Prepared by: Filliciano Plong · Date: October 28, 2026 · Version: 1.0

**Readers:** Filliciano Plong, developer and tester of OTCP. Status: Approved 2026-10-28. Based on approved SRS 1.0 and Architecture 1.0.

## Contents

- [Revision history](#revision-history)
- [1. Purpose and scope](#1-purpose-and-scope)
- [2. Chosen direction](#2-chosen-direction)
- [3. Design tokens (Ink)](#3-design-tokens-ink)
- [4. Components](#4-components)
- [5. Faceted filters](#5-faceted-filters)
- [6. Screens](#6-screens)
- [7. App icon](#7-app-icon)
- [8. Accessibility](#8-accessibility)
- [9. Decisions](#9-decisions)
- [10. Files](#10-files)

## Revision history

| Version | Date | Changes |
|---|---|---|
| 1.0 | October 28, 2026 | Approved by Filliciano Plong. First release of the UI. |

**Status:** Approved 2026-10-28 by Filliciano Plong. Version 1.0.


## 1. Purpose and scope

This document decides how OTCP looks and feels before implementation-plan issues are cut. It covers chrome, tokens, components, faceted filters, every screen in the SRS Screen map reference, and the Stack favicon colour round. The SRS wins wherever this specification differs from it.

| Source | Constraint |
|---|---|
| NFR-09 | WCAG 2.2 Level AA |
| NFR-10 | Full keyboard operability |
| NFR-11 | Ban status, errors, and selection never by color alone |
| NFR-12 | First-class layout at 375 CSS px; also 1280 px |
| NFR-13 | Clean, minimal, monochrome-leaning chrome; card art supplies most color (Should) |
| NFR-16 | Current Chrome, Firefox, Safari, Edge |
| Architecture | Tailwind 4; React SPA on GitHub Pages `/otcp/`; FilterEngine + SearchIndex (ADR-012, ADR-009) |

Mobile-first and fast mid-game: sticky top nav, 44 px search field, hamburger on phone, faceted Filters sheet on phone, ban badges readable at a glance, deck builder counts always visible.

## 2. Chosen direction

**Ink** is the product chrome (UI-D1 APPROVED 2026-10-27 6:54 PM PT).

Quiet monochrome shell; card art is the only strong color. Accent is near-black / near-white. Overview: `docs/images/ui/direction-ink-overview.png`. Sources: `docs/ui/directions/ink/`.

Default theme (UI-D3): **Match system** via `prefers-color-scheme`; Account may set Light / Dark / Match system with `data-theme`.

Phone navigation (UI-D4): **Hamburger drawer** for Search, Formats, Decks, Collection, Lists, Account. Not a bottom tab bar; not an overflow-only menu. **No separate Builder nav item** — the deck editor *is* the builder, opened from Decks (My decks → open / New deck). Desktop top nav matches: Search, Formats, Decks, Collection, Lists.

View modes (UI-D5, UI-D9): desktop **search, Lists, and Collection** offer **List / Grid / Table**; under about **640 CSS px** Table is hidden and the user chooses List or Grid (no sticky-column horizontal table scroll). Phone: List and Grid only.

Lists and Collection tables (UI-D10): defaults **Name, Qty, Set, Rarity, Purchase price, Market price** (Collection also **Condition**); add any other stored API/printing/price field from a header context menu or keyboard **Columns** control; sort, per-column filter, drag-reorder, resize. The **full setup** (visible columns, order, widths, sort, active filters) is remembered and restored next open, per table (search if customized, each List, Collection); signed-in sync via profile, localStorage when signed out.

Value summary (UI-D11): Collection, Lists, and Decks show **Current**, **Paid**, **Profit/loss**, and a priced count. Purchase and Market columns are **per-unit**. Current = Σ(market × qty) over all rows; Paid = Σ(purchase × qty) over priced rows; P/L = Σ(market × qty) over those priced rows − Paid (may be negative). Condition / EU / 1st / faded are user attributes; API market price is not auto-adjusted.

**List / Grid toggle (FR-60):** Global control on search, decks, banlists, format pools, Lists, and collection. **List** = thin rows with a small left thumbnail (~32–40 CSS px, card aspect), name, **one row of official game icons** (Yu-Gi-Oh!: **card-type frame-mini first**, then attribute or Spell/Trap property, typing/race, level/rank star + number or Link marker icon only), then a thin divider and **separated ATK (Master Duel sword) / DEF (Master Duel shield)** values (Link: ATK + link rating, no DEF), and a **format-gated** ban marker (Master Duel 1 / 2 / Forbidden icons; Unlimited/3 never shown on list/grid) — **LIST and GRID: bare ban top-left on thumbnail/art** — no text type line and no effect snippet. Ban markers appear on search/browse/collection/Lists **only when a format filter is active**; deck views always show them (deck format applies). **Grid** = images only with ban/copy badges (name on hover or long-press). Desktop also keeps **Table** as a third mode for **search, Lists, and Collection**. Preference remembered in localStorage and on the signed-in profile. Defaults: Grid for search and deck on desktop; last choice elsewhere. Phone grids use at least **3 columns** between 360–430 CSS px (4+ on wider phones/tablets); tap targets ≥ 44 CSS px.

**Compact ban markers (APPROVED 2026-10-27):** Limited = **1**, Semi-Limited = **2**, Forbidden = **⊘** (circle-slash). Existing ban colors kept. Full word remains in `title` / `aria-label` / visually hidden text so NFR-11 (status + color) stays satisfied. Used on list rows, grid overlays, deck tiles, format lists, and card detail. Tooltips/legend: hover or long-press shows Limited / Semi-Limited / Forbidden.


**List / Grid ban placement (APPROVED 2026-10-28 — thumb for both):** In **LIST** and **GRID** the **bare Master Duel ban icon** sits on the **card thumbnail / art (top-left corner)** — icon only, no colored or white container/badge (subtle drop shadow for legibility). Size ≈ 40–50% of thumbnail width so it stays legible without covering most of the art; clipped to the thumb. Removed from the inline icon row (no ban divider). Same format-gating: deck views always; search/browse/collection/Lists only with a format filter; Unlimited (3) never on list/grid. Prior inline variants kept as `screen-ink-search-list-format-{thumb,inline}-*.png`.

**Card detail icon chips:** Same icons as list rows (same order), each **with its text label** (e.g. frame-mini + “Effect” / “Spell”, attribute + “WIND”, typing + “Dragon”, star + “Level 3”, sword + “ATK 0”, shield + “DEF 1800”, property + “Continuous”). Ink-style outline chips.

**ATK / DEF icons:** Official Master Duel circular ATK (sword, geom-v2 flaring pointed blade) / DEF (shield) badges (Konami) — unchanged this pass. Sources in `docs/images/ui/icons/SOURCES.md`. Prior redraws under `icons/fallback/`. Spell/Trap **card-type** uses `frame-mini/spell.png` and `frame-mini/trap.png` (old type badges in `fallback/`); Spell/Trap **property** icons stay under `spell-trap/`; full card-frame art under `frame/`.

**Yu-Gi-Oh! list icons (APPROVED 2026-10-27; owner pack 2026-10-28):** Official Konami attribute, typing (race), level/rank, and Spell/Trap **property** symbols from the owner-supplied pack, normalized under `docs/images/ui/icons/{attribute,race,spell-trap,level}/` (kebab-case PNG 1×/2×/3×; originals in `source-owner/`). **Card-type** icons are Master Duel–style **mini card-frame glyphs** under `icons/frame-mini/` (cut from owner `Frames-mini/` screenshots; crop-check `frame-mini-crop-check.png`). They **replace** the old Spell/Trap type badges (moved to `fallback/`). ART placeholders use the official card back (`misc/card-back-thumb.jpg`). Master Duel ban icons and ATK/DEF badges stay as previously approved. Link monsters use the owner pixel-art **Link marker** (active arrows red) plus **Link-N** text — see `icons/link/`. Declared in `docs/data/games/yugioh/icons.json` (ADR-012). Sources: `docs/images/ui/icons/SOURCES.md`. Contact sheet: `docs/images/ui/icons/icon-contact-owner.png`.

**Icon row / detail chip order (APPROVED 2026-10-28):** **card-type frame-mini first** on every card, then attribute (monsters) or property (spells & traps), then race (monsters), then level/rank or Link marker (icon only in rows; Link-N label in detail chips), then ATK / DEF (Link: ATK only). Same order in card detail chips (with text labels).

**Row icon alignment (APPROVED 2026-10-28):** In list / CardFinder / editor rows and detail chips, every icon’s **visible** top and bottom sit on the same two lines (identical visible height). Pre-rasterized solid-edge PNGs live under `icons/baked/{row,detail}-{16|18|32|36|48|54}/` (generator `docs/data/games/yugioh/bake_icons.py`). Circles use LANCZOS + α≥128 edge fit; pixel art (frame-mini, level, Link) uses cover/max-alpha NN so sparse tip pixels survive. Link marker is tip-trimmed from the full 29×29 map (α≥1 — all 8 arrow tips, including gray, stay inside the box); tips land on the shared top/bottom. CSS: shared height 16/18, `overflow:visible`, Link `image-rendering:pixelated`. Mocks load baked assets with 1x/2x/3x `srcset`. Alignment check: `icons/icon-row-alignment-check.png`. Link tip 8× zoom: `icons/link-marker-tips-8x.png`. Ritual frame-mini still missing from the owner pack.


**Faceted filters:** Desktop search/browse screens use the **full two-layer faceted sidebar** (Game → Core groups with counts, search-within, show more, ranges → Yu-Gi-Oh! extension groups), matching `filters-desktop.png`. Phone opens the same facets in a full-screen Filters sheet (`filters-phone.png`) from the Filters button. Search, deck builder, collection, and Lists share this component.


**CardFinder (in-editor add):** Reusable compact finder beside the deck / list / collection editor so users are not forced through the full Search page to add cards. Components: search box; compact **Filters** button that opens the **same** faceted filter component (desktop: popover / panel section inside the finder; phone: the existing Filters drawer/sheet); results as compact list rows (thumbnail + name + icon row; **bare MD ban** on thumbnail top-left + muted sub-line + **− qty + stepper**) or a small grid (**bare MD ban icon** on art top-left — no colored badge/container behind it; stepper on tile). Minus is disabled when the count is 0; the stepper value is the current in-deck / on-list / owned count. Ban markers in the finder follow the **open deck’s / list’s format** (always on in deck editor).

**Editor rows = Add-cards rows:** Deck, list (want list), and collection editors use the **same row component** as CardFinder results — same height, padding, borders, and typography: thumbnail left (bare ban top-left when format-gated), name, icon row (card-type frame-mini · attribute/property · race · level/link | ATK/DEF), muted sub-line, − qty + on the right. No separate boxed rows with the stepper on the left. Editor-specific info goes in the muted sub-line (or a small trailing control that does not change the layout): lists add a checkbox before the thumbnail and put set + price in the sub-line; collection puts printing in the sub-line. Deck keeps Main/Extra/Side section headers with counts.

- **Desktop (~1280):** Split view — finder panel left **~360–400 CSS px**, editor right. **+** adds the card; drag-and-drop into Main / Extra / Side is supported (drag affordance on finder rows; drop hints under deck sections).
- **Phone (~390):** Editor is the main view with sticky deck count / legality bar and an **Add cards** button that opens the finder as a bottom sheet (half height, expandable to full). **+** adds with a count bump (toast optional); quantity steppers on cards already in the editor.
- Full **Search** page remains for browsing. Lists and Collection editors use the same CardFinder (counts read “on list” / “owned”).
- Mockups: `screen-ink-deck-editor-{desktop,phone,sheet-phone}-light.png`, `screen-ink-list-editor-*`, `screen-ink-collection-editor-*`.

**Calm search toolbar:** Search input alone on its line. **Desktop (liked):** muted results/sort text on the left, icon-only outline view toggle on the right, chips below. **Phone:** row 1 = Filters (count) + view toggle; row 2 = short result count + small Sort control; then one horizontally scrolling chip row with Clear all. Deck header format/Valid tags and Export/Share stay quiet; one primary action (Save) stays emphasized.

**Card detail:** Identity/effect/stats sit in the same bordered info cards as Legality, Prices, and Sets (phone and desktop). One page gutter on phone including the image.

### Directions considered

Arena (muted gold) and Ledger (slate-blue) were rendered for comparison and remain on file under `docs/images/ui/direction-arena-overview.png` and `direction-ledger-overview.png` plus `docs/ui/directions/{arena,ledger}/`. They are not used in the main screen set.

## 3. Design tokens (Ink)

One file: `docs/ui/tokens.css`. Light and dark via `prefers-color-scheme` and `data-theme`. Tailwind 4 maps these via `@theme` after UI approval. Contrast: `docs/ui/contrast.txt` (all primary text pairs ≥ 4.5:1; control borders ≥ 3:1).

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `#F7F7F5` | `#0E0E0E` | Page background |
| `--color-surface` | `#FFFFFF` | `#171717` | Cards, panels, table |
| `--color-surface-2` | `#EFEFEA` | `#222222` | Chips, subtle fills |
| `--color-text` | `#141414` | `#F2F2F0` | Body |
| `--color-text-2` | `#5C5C5C` | `#A8A8A4` | Secondary |
| `--color-heading` | `#0A0A0A` | `#FAFAF8` | Titles |
| `--color-border` / `-strong` | `#D6D6D0` / `#8A8A8A` | `#2E2E2E` / `#7A7A76` | Dividers / controls |
| `--color-accent` | `#1A1A1A` | `#F2F2F0` | Primary button, active chip |
| `--color-on-accent` | `#FFFFFF` | `#0E0E0E` | Text on accent |
| `--color-ban-*` | Forbidden / Limited / Semi / Unlimited | Lighter pairs | Always with text label (NFR-11) |

Type: system UI sans; mono for YDK. Sizes 11–24 px. Space 4–48 px. Radius 4 / 8 / 12 / pill. Touch ≥ 44 CSS px. Motion 120–200 ms; 0 under `prefers-reduced-motion`.

## 4. Components

| Component | States | Notes |
|---|---|---|
| Button primary / secondary / ghost / danger | default, hover, pressed, focus-visible, disabled | Two-tone focus ring |
| Search field | empty, filled, focus, disabled | 44 px; Escape clears when focused |
| Filters button | idle, active count badge | Opens phone sheet; desktop focuses sidebar |
| Facet group | collapsed, expanded | Checkbox lists with live counts; search-within; show more; ranges; arrow picker |
| Active filter chip | removable | Above results; Clear all |
| Ban badge | Forbidden / Limited / Semi / Unlimited | Text + color + leading dot |
| Card tile | default, focus | Art placeholder until art loads; Grid mode shows badges only |
| List row | default, focus | Text-only: name, type, stats, ban; no images |
| View mode toggle | List / Grid (/ Table on desktop search) | Persisted localStorage + profile |
| Owned / missing badge | owned qty · missing qty | Deck builder vs collection |
| Want-list row | qty, set/rarity target, note, acquired | Running snapshot price total in header |
| Collection tile / row | qty × set · rarity | Same List/Grid/Table as search on desktop |
| Data table | header sticky on desktop | Third mode on search, Lists, Collection; below ~640 use List/Grid |
| Dialog / sheet | open, focus trap | Export, import, delete, filter sheet, check-off → collection |
| Nav | hamburger (phone) / link row (desktop) | Sticky; includes Collection and Lists |
| Points meter | under / at / over cap | Number + optional bar |

## 5. Faceted filters

Pattern: **faceted search in the style of major card marketplaces** (owner UX reference recorded privately in `requirements-record.md`; no third-party branding or visuals in these mockups).

1. **Game first.** Choosing the product line (game) comes before game-specific facets. v1 selects Yu-Gi-Oh!.
2. **Two layers.** Core (any TCG) groups always available; game-extension groups appear from declaration data once the game is selected (SRS Filter fields reference; FR-56).
3. **Facet UI.** Collapsible groups; checkbox options with **live result counts**; long lists get search-within and show more; numeric fields use ranges; Link arrows use an arrow picker.
4. **Logic.** Include / exclude (NOT) and AND/OR where the field definition allows (FR-58).
5. **Chrome.** Desktop: left filter sidebar. Phone: Filters button (active count badge) opens a full-screen sheet with Reset and **See N results**; hamburger stays for app navigation.
6. **Chips.** Selected facets as removable chips above results + Clear all; result count and sort in the results header.
7. **Presets.** Saved filter presets are Should (FR-59), not Must.

Mockups:

- Desktop sidebar: `docs/images/ui/filters-desktop.png`
- Phone sheet open: `docs/images/ui/filters-phone.png`

Engine and budget: Architecture FilterEngine + SearchIndex bitsets (ADR-012). Name search stays under 100 ms (NFR-01). On-screen facet-count refresh targets the same budget; UNVERIFIED until S-01 (lazy off-screen groups allowed).

## 6. Screens

Inventory matches the SRS Screen map. Mockups are **Ink · light** unless noted.

Phone contact sheet: `docs/images/ui/screens-ink-phone-sheet.png`  
Desktop contact sheet: `docs/images/ui/screens-ink-desktop-sheet.png`

| Screen | Purpose | Mockup |
|---|---|---|
| Home / Search | Search, Filters, chips, List/Grid (/Table desktop) | `screen-ink-search-*-light.png`, `screen-ink-search-list-*-light.png`, `screen-ink-search-grid-phone-light.png` |
| Results / Table | Desktop Table on search | `screen-ink-table-*-light.png` |
| Lists · Table | Desktop Table on Lists | `screen-ink-wantlist-table-desktop-light.png` |
| Collection · Table | Desktop Table on Collection | `screen-ink-collection-table-desktop-light.png` |
| Faceted filters | Sidebar / sheet | `filters-desktop.png`, `filters-phone.png` |
| Card detail | Phone stacked; desktop two-column; add to deck/collection/want | `screen-ink-detail-*-light.png` |
| Formats / banlist | Must formats; List/Grid pools | `screen-ink-format-detail-desktop-light.png` |
| Deck list (My decks) | Entry to the deck editor; New deck | `screen-ink-my-decks` / screens folder |
| Deck editor · CardFinder | Split finder+editor (desktop); Add-cards sheet (phone open/closed); qty steppers; sticky legality | `screen-ink-deck-editor-desktop-light.png`, `screen-ink-deck-editor-phone-light.png`, `screen-ink-deck-editor-sheet-phone-light.png` |
| Deck editor · Genesys / Speed / owned | Points / Skill / owned-missing (still under Decks, not a Builder nav) | `screen-ink-builder-*-*.png`, `screen-ink-builder-owned-desktop-light.png` |
| List editor · CardFinder | Want-list editor with same finder; qty steppers; check-off | `screen-ink-list-editor-desktop-light.png`, `screen-ink-list-editor-phone-light.png`, `screen-ink-list-editor-sheet-phone-light.png` |
| Lists (browse) | Named want lists; List/Grid/Table desktop | `screen-ink-wantlist-phone-light.png`, `screen-ink-wantlist-desktop-light.png`, `screen-ink-wantlist-table-desktop-light.png` |
| Collection editor · CardFinder | Owned printings editor with finder | `screen-ink-collection-editor-desktop-light.png`, `screen-ink-collection-editor-phone-light.png`, `screen-ink-collection-editor-sheet-phone-light.png` |
| Collection (browse) | Owned printings; List/Grid/Table desktop | `screen-ink-collection-phone-light.png`, `screen-ink-collection-desktop-light.png`, `screen-ink-collection-table-desktop-light.png` |
| Export / Import | YDK / YDKE / Mass Entry / text | screens folder |
| Sign-in | Email/password + Google | `screen-ink-signin-phone-light.png` |
| My decks / Shared / Account | List, read-only, theme | screens folder |
| Empty / Loading / Error / Offline / Notices | States | screens folder |

Phone search mockups show the hamburger control. Table-on-phone frames use Grid (UI-D5). Lists and collection are guest-capable in the browser; save/share require sign-in (same rule as decks).

## 7. App icon

Shape (UI-D2 APPROVED): **A · Stack** — three overlapping card silhouettes. No Konami / Yu-Gi-Oh! trademarks or card art.

Colour round (this pass): `docs/images/ui/icon-stack-colour-sheet.png`

| Variant | Tile | Notes |
|---|---|---|
| **V1 · Mono charcoal** | `#1A1A1A` | Recommended — matches Ink tokens; strong on light and dark bars |
| V2 · Mono paper | `#F2F2F0` | Inverted mono for light launchers |
| V3 · Cool slate accent | `#141820` + `#8FA6CF` mid card | Single cool accent only; no warm/brown |

**Approved colour (UI-D6, 2026-10-28):** **V1 · Mono charcoal** (`#1A1A1A`). Ship favicon and PWA/manifest assets from this variant. V2/V3 remain on file as rejected alternatives for this release.

Shape concepts sheet (historical): `icons-concepts-sheet.png`. Individuals: `icon-a-stack.png` (and B/C left on file).

## 8. Accessibility

| Rule | How |
|---|---|
| WCAG 2.2 AA contrast | Token pairs in `contrast.txt` |
| Keyboard | Tab order; dialogs/sheets trap focus; Escape closes |
| Not by color alone | Ban badges include text; facet counts are numeric text |
| Touch | 44 px minimum on primary controls and Filters |
| Reduced motion | Motion tokens → 0 |
| Facet counts | Text counts next to options; not color-only |

## 9. Decisions

| ID | Decision | Status |
|---|---|---|
| UI-D1 | Visual direction → **Ink** | APPROVED 2026-10-27 6:54 PM PT |
| UI-D2 | App icon shape → **A Stack** | APPROVED 2026-10-27 6:54 PM PT |
| UI-D3 | Default theme → **Match system** | APPROVED 2026-10-27 6:54 PM PT |
| UI-D4 | Phone nav → **Hamburger** | APPROVED 2026-10-27 6:54 PM PT |
| UI-D5 | Table on phone → **Card grid &lt;~640 px** | APPROVED 2026-10-27 6:54 PM PT |
| UI-D6 | Stack icon colour → **V1 Mono charcoal** | **APPROVED** 2026-10-28 |
| UI-D7 | Approve UI 1.0 as Approved | **APPROVED** 2026-10-28 |
| UI-D8 | CardFinder in deck/list/collection editors; remove Builder nav | **APPROVED / FOLDED** 2026-10-27 — SRS FR-22/67/71 + screen map / appendix; Arch AppShell/DeckBuilder |
| UI-D9 | Desktop **search, Lists, and Collection** keep **Table** as third view (List / Grid / Table on desktop ≥~640; List / Grid on phone) | **APPROVED** 2026-10-28; extended 2026-10-28 (REC-WL-01) — matches FR-06 / FR-60 |
| UI-D10 | Customizable Lists/Collection tables (defaults + header menu + Columns; sort/filter/reorder/resize; **full setup restored on reopen** per table, synced when signed in) | **APPROVED** 2026-10-28 — FR-72..75 |
| UI-D11 | Value summary on Collection, Lists, Decks: per-unit Purchase/Market; Current=Σ(mkt×qty); Paid=Σ(purch×qty) priced; P/L=priced current−Paid; condition/variants | **APPROVED** 2026-10-28 — FR-76..78 |
| UI-P1 | Link marker row size (currently 16 CSS px shared height) | **Deferred polish** — not a v1 blocker; revisit after first implementation pass |

SRS/Architecture folds from these picks (including UI-D6 / UI-D9) are listed as FOLDED in `pending_edits.md`. Open polish: UI-P1 Link marker size.

## 10. Files

| Path | What |
|---|---|
| `docs/UI.md` | This specification (1.0 Approved) |
| `docs/Plong_OTCP_UI.docx` / `.pdf` | House-style copies |
| `docs/ui/tokens.css` | Ink light/dark tokens |
| `docs/ui/contrast.txt` | Contrast check |
| `docs/ui/directions/` | HTML + PNG (Ink primary; Arena/Ledger retained) |
| `docs/ui/screens/` | Per-screen HTML + PNG |
| `docs/ui/icons/` | Icon source renders |
| `docs/images/ui/` | PNGs referenced by the docs |

Rebuild directions/screens: `python3 docs/ui/directions/src/build.py`. Rebuild icons: colour sheet script / `build_icons.py`.
