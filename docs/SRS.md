# Software Requirements Specification: OTCP

Prepared by: Filliciano Plong · Date: October 27, 2026 · Version: 1.0

**Readers:** Filliciano Plong, developer and tester of OTCP. Status: Approved 2026-10-27.

## Contents

- [Revision history](#revision-history)
- [1. Introduction](#1-introduction)
- [2. Scope](#2-scope)
- [3. Overall description](#3-overall-description)
- [4. User classes](#4-user-classes)
- [5. Constraints and assumptions](#5-constraints-and-assumptions)
- [6. Functional requirements](#6-functional-requirements)
- [7. Non-functional requirements](#7-non-functional-requirements)
- [8. Use cases](#8-use-cases)
- [9. Data requirements](#9-data-requirements)
- [10. External interfaces](#10-external-interfaces)
- [11. Open decisions](#11-open-decisions)
- [12. Acceptance criteria](#12-acceptance-criteria)
- [13. Future features](#13-future-features)
- [14. Traceability](#14-traceability)
- [References](#references)
- [Appendix: Interface sketch](#appendix-interface-sketch)

## Revision history

| Version | Date | Changes |
|---|---|---|
| 1.0 | October 27, 2026 | Approved by Filliciano Plong. First release of the requirements. |

**Status:** Approved 2026-10-27 by Filliciano Plong. Version 1.0.

## 1. Introduction

### 1.1 Purpose

This document defines what OTCP (Open TCG Project) must do and how well. OTCP is a fast web card lookup for trading card game players, with formats, banlists, and a deck builder.

### 1.2 Intended audience

Filliciano Plong, the sole developer, uses this document to plan, build, and test OTCP. Sections 6 and 7 hold the requirements; section 12 says how each is accepted.

### 1.3 Problem statement

During a match or a deck build, looking up a card's text, legality, or price should take seconds, not a hunt across forums and slow databases. Existing tools are either heavy, incomplete for historical formats, or force hotlinked art and accounts the player does not want. OTCP aims to be a clean, fast, mobile-first reference that players can trust mid-game and while deckbuilding.

### 1.4 Product overview

OTCP is a web app for Yu-Gi-Oh! card search, filters, table view, the Must formats in the Formats reference, and a deck builder with save, export, and share. Card data comes from free upstream sources at build time into an OTCP-owned versioned schema; formats and overrides are hand-curated. Images are downloaded at build time and served from the site. Accounts and saved decks use a managed backend (Supabase per OD-02).

### 1.5 Definitions

| Term | Meaning |
|---|---|
| OTCP | Open TCG Project, this product. |
| Card | One trading card entry in the OTCP schema, with core fields and a per-game extension. |
| Passcode | The eight-digit Yu-Gi-Oh! card ID used by simulators and `.ydk` files. |
| Format | A named rules environment: a card pool and a banlist or point list for that era or mode. |
| Banlist | The Forbidden, Limited, and Semi-Limited (or equivalent) list for a format. |
| Card pool | The set of cards legal to include in a format before banlist or point rules are applied. |
| Advanced | Current TCG constructed: official Forbidden & Limited List; Forbidden cards may not be used. |
| Traditional | Same TCG list as Advanced, except Forbidden cards are treated as Limited (one copy). |
| Speed Duel | Separate Speed Duel card pool (Speed Duel logo), Skill cards, and smaller deck sizes. |
| Genesys | Konami constructed mode: no Link or Pendulum; point values on some cards; combined deck point cap (standard 100). |
| Genesys points | Per-card point cost used only in Genesys; most cards cost zero; event caps may differ. |
| Skill card | A Speed Duel card that is not part of the Main Deck; at most one active Skill per Duel. |
| Deck | A list of cards in Main, Extra, and Side for one format. |
| Overrides file | A hand-curated file that corrects or supplements upstream card data. |
| Upstream | A free external data source used at build time (for example YGOPRODeck). |
| Build-time refresh | A scheduled or manually triggered pipeline that fetches, normalizes, validates, and publishes card data and images. |
| YDK | Plain-text Yu-Gi-Oh! deck file of card ids with `#main`, `#extra`, and `!side` markers. OTCP follows YGOPRODeck's layout, including Speed Duel Skill ids under `#main`. |
| YDKE | Compact `ydke://` clipboard URL encoding Main, Extra, and Side passcodes as Base64. |
| TCGplayer Mass Entry | Clipboard lines of quantity, card name, optional set code, and optional number for TCGplayer Mass Entry. |
| Guest session | An unsigned-in browser session that can build and export a deck but cannot persist it to an account. |
| MoSCoW | Priority scheme: Must, Should, Could, Future. |
| Reference phone | Generic mid-range phone for performance targets: mid-tier Android (~6 GB RAM) or iPhone SE-class on LTE or typical Wi-Fi (see constraints). |

### 1.6 Related documents

Lists of fields and formats are in the named reference tables in the References section at the end.

- OTCP requirements record (`docs/requirements-record.md`), October 27, 2026.
- OTCP architecture document (to be written; will trace to this SRS).
- Foundation draft PR: github.com/fillicianoplong/otcp/pull/1 (stack proposal; accepted as OD-04).
- YGOPRODeck API Guide v7: ygoprodeck.com/api-guide.
- Konami Forbidden & Limited / deck construction: yugioh-card.com/en/limited/.
- Konami Genesys: yugioh-card.com/en/genesys/.
- Konami Speed Duel Guide (PDF): img.yugioh-card.com/en/downloads/rulebook/Speed_Duel_Guide_EN.pdf.
- Format Library formats index (UX reference only): formatlibrary.com/formats/.
- Format Library Terms of Use: formatlibrary.com/terms.html.
- Goat Format card pool: goatformat.com/cardpool.html.
- Edison Format banlist: edisonformat.net/rules/banlist.
- HAT Format banlist: hatformat.com/banlist.html.
- Tengu Format banlist: tenguformat.com/banlist/.
- TCGplayer API getting started (new access closed): docs.tcgplayer.com/docs/getting-started.
- TCGplayer Mass Entry help: help.tcgplayer.com/hc/en-us/articles/360055768913.
- WCAG 2.2: w3.org/TR/WCAG22.

## 2. Scope

OTCP is a web card lookup and deck tool for Yu-Gi-Oh! in v1. Section 4 describes who uses it.

### 2.1 In scope

- Yu-Gi-Oh! card search, filters, detail view, and table view.
- Must formats in the Formats reference: Advanced, Traditional, Speed Duel, Genesys, Goat, Edison, HAT, and Tengu.
- Deck builder with Main, Extra, and Side; guest use without an account; format-specific deck rules.
- Accounts to save decks; export and share decks in the Deck export formats reference.
- Store prices from the Price sources reference and outbound links to store search pages.
- Build-time card data and image pipeline with weekly and manual refresh.
- OTCP-owned versioned card schema (shared core + Yu-Gi-Oh! extension), extensible for later games.
- Online web app for current Chrome, Firefox, Safari, and Edge on desktop and mobile.

### 2.2 Out of scope

- Opening-hand and draw / shuffle simulators.
- Offline mode, service worker caching as a PWA, or installable app.
- Playable games other than Yu-Gi-Oh! in v1 (schema must still allow later games).
- Scraping Format Library or any site whose terms forbid it.
- Direct TCGplayer API pricing (new developer access is closed as of research date).
- In-app purchasing, payment, or inventory management.
- Real-time multiplayer, chat, or tournament pairing.
- Judge tools, ruling databases, or community forums.
- Could formats (for example TeleDAD) until added later.

Deferred items with reasons are in section 13.

## 3. Overall description

### 3.1 Product context

OTCP is a browser application. Static card data and images are published with the site. Accounts and saved decks use Supabase (OD-02). Upstream providers are contacted at build time, not from every visitor's browser for card JSON or art.

### 3.2 Main functions

- Card search, filters, table view, and detail (6.1 to 6.3).
- Formats and banlists, including Genesys points and Speed Duel Skills (6.4).
- Deck builder, export, owned/missing vs collection, and guest use (6.5, 6.6).
- Want lists and basic collection (new subsections). User-facing nav/screen label for want lists is Lists (folded 2026-10-27).
- Accounts, saved decks, and sharing (6.7, 6.8).
- Prices and store links (6.9).
- Data schema, upstream ingest, refresh, and images (6.10, 6.11).

### 3.3 Operating environment

- Current stable Chrome, Firefox, Safari, and Edge on desktop and mobile (NFR-16).
- Online network access required (FR-55).
- Reference phone for targets: mid-tier Android (~6 GB RAM) or iPhone SE-class on LTE or typical Wi-Fi (constraint in section 5).
- Static hosting on GitHub Pages at `/otcp/` (OD-09) plus Supabase (OD-02).

## 4. User classes

| Class | Role | Experience | Main tasks | Frequency |
|---|---|---|---|---|
| Player | Looks up cards mid-game or while deckbuilding | Comfortable with web apps and TCG terms | Search, filter, check ban status, build and export decks | Several times per week |
| Collector (secondary) | Checks prices and store availability | Same as Player | Open card detail, compare prices, follow store links | Weekly |

Recruiters and portfolio reviewers may see the public site; they are stakeholders for presentation quality, not a primary user class with separate requirements.

## 5. Constraints and assumptions

### 5.1 Constraints

| Constraint | Source |
|---|---|
| Yu-Gi-Oh! is the only playable game in v1; the schema must stay extensible. | Product brief |
| Card images must be downloaded at build time and served from the site; no runtime hotlinking of YGOPRODeck images. | Interview; YGOPRODeck API Guide |
| Accounts and saved decks use a managed backend; GitHub Pages alone is insufficient. | Interview; OD-02 |
| Online only; no offline or PWA mode in v1. | Interview |
| English interface for v1. | Developer decision |
| Solo developer; Should features drop in the order in section 6 if time runs short. | Approved 2026-10-27 |
| Client stack is Vite, React, TypeScript, Tailwind, Vitest, and Playwright (OD-04). | OD-04; PR #1 |
| Static site base path is `/otcp/` for the GitHub Pages project site (OD-09). | OD-09 |
| Do not scrape Format Library; use it as a formats UX reference only (OD-01). | OD-01; Format Library Terms |
| Format and banlist data are hand-curated snapshots plus YGOPRODeck cards, sets, and dates (OD-01). | OD-01 |
| Prices refresh with the weekly (and manual) card-data pipeline from YGOPRODeck `card_prices` (OD-03). | OD-03 |
| Auth methods are email/password and Google OAuth (OD-06). | OD-06 |
| Deck sharing is a public read-only link with an opaque id; the owner can revoke (OD-07). | OD-07 |
| Shown price vendors are TCGplayer, CoolStuffInc, and Cardmarket (OD-08). | OD-08 |
| After confirmed account deletion, the account and personal decks, want lists, and collection are hard-deleted immediately; only provider backups may remain until they age out within 30 days (OD-10). | OD-10 |
| Genesys points ingest from YGOPRODeck `genesys_points`; each refresh spot-checks Konami and reports diffs without auto-applying them (OD-11). | OD-11 |
| Genesys deck builder defaults to a 100-point cap and lets the user set a custom cap (OD-12). | OD-12 |
| Guests may build and export decks and keep want lists and the collection in the browser without an account; sign-in is required to save to an account or share. Guest drafts stay in the browser until site data is cleared, imported after sign-in, or overwritten; they are not covered by OD-10. | Approved 2026-10-27 |
| Performance targets use a generic mid-range phone: mid-tier Android (~6 GB RAM) or iPhone SE-class on LTE or typical Wi-Fi; the test plan records the exact device when first measured. | Approved 2026-10-27 |

### 5.2 Assumptions

| Assumption | How to validate |
|---|---|
| YGOPRODeck remains freely usable under its published API rules (rate limit, local storage of data and images). | Re-check ygoprodeck.com/api-guide before each major release. |
| Supabase free tier can host auth and deck storage within v1 traffic expectations. | Spike during architecture; watch free-tier limits. |
| Official and community banlist texts are accurate enough to hand-curate format snapshots. | Spot-check each Must format against primary sources before release. |
| YGOPRODeck `format=Speed Duel`, `type=Skill Card`, and `misc_info.genesys_points` stay available for build-time ingest. | Re-check API Guide and sample calls each major release. |

## 6. Functional requirements

Each line is one testable behavior with one MoSCoW priority. Must is required for release. Should is planned, and is cut in the order below if time runs short.

Verification is Test, Demo, Inspection, or Analysis. Lines flagged UNVERIFIED rest on a claim still to check.

**Should drop order.**

1. Optional table column visibility persistence beyond the session (FR-08).
2. Saved filter presets (FR-59).
3. Collection bulk import from plain text (FR-68).
4. Deck file name from deck name (FR-30).
5. Rename saved deck (FR-39).

### 6.1 Card search

Search is the primary mid-game path. Results update as the player types once the local card index is ready.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-01 | The system shall search cards by name as the user types, after the card index is loaded. | Must | Test: type a known name; matches appear. |
| FR-02 | The system shall match partial names and card text tokens. | Must | Test: a substring unique to one card returns it. |
| FR-03 | The system shall find a Yu-Gi-Oh! card by its passcode. | Must | Test: enter a known passcode. |

### 6.2 Filters

Filters use faceted search in the style of major card marketplaces: a game (product line) is selected first, then a two-layer facet panel — shared core fields for any TCG, plus game-specific fields declared by that game's extension. Selected facets appear as removable chips with Clear all; each option shows a live result count.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-04 | The system shall filter cards by every field in the [*Filter fields reference*](#filter-fields-reference) for the selected game. | Must | Inspection: each listed field changes the result set. |
| FR-05 | The system shall clear all filters in one action and restore the unfiltered list for the active format pool. | Must | Test: apply three filters, clear, count matches the full index. |
| FR-56 | The system shall present a shared core filter layer for any TCG and a game-specific layer that appears only after a game is selected, driven by that game's extension filter definitions (field, control type, grouping). | Must | Inspection: with Yu-Gi-Oh! selected, core and Yu-Gi-Oh! groups both appear; core-only fields remain if another game is added later. |
| FR-57 | The system shall show a live result count next to each facet option for the current query (other selected facets applied), and refresh counts when the query changes. | Must | Test: select Attribute=DARK; other Attribute counts update; total result header matches. |
| FR-58 | The system shall support include and exclude (NOT) on multi-value facets and AND/OR within a facet group where the field definition allows it (for example card types). | Must | Test: include Effect + exclude Fusion; OR across two Attributes. |
| FR-59 | The system shall let a signed-in user save and reapply named filter presets for the selected game. | Should | Test: save a preset, clear filters, reapply; guest sees no preset store. |

### 6.3 Table view

Table view supports comparison across many cards. Lists, Collection, and search share the same customizable DataTable (approved 2026-10-28, REC-TABLE-01); search keeps its own default columns (combat stats).

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-06 | The system shall use the customizable desktop Table as the default view on search results, Lists, and the collection on viewports at or above about 640 CSS pixels (List and Grid remain available toggles); under that width Table is hidden and those screens use compact icon rows (List) to save space — no horizontally scrolling table. | Must | Demo: at 1280 px Search/Lists/Collection open in Table by default; user can switch to List/Grid; at 390 px Table is absent and compact icon rows show. |
| FR-07 | The system shall sort the table by any visible column, ascending or descending. | Must | Test: sort by Name and by Market price both ways on Lists or Collection; sort by ATK on search. |
| FR-08 | The system shall let the user customize the search desktop table with the same DataTable controls as Lists and Collection (header context menu / Columns, sort, per-column filter, reorder, resize, full-setup restore); search default columns remain those in the [*Table columns reference*](#table-columns-reference) for search. | Must | Demo: on search Table add Archetype via Columns, sort ATK, leave and reopen — setup restores; defaults still Name/Type/Attribute/Level/ATK/DEF/Ban. |
| FR-72 | On desktop (Table as default view per FR-06), the system shall show Lists tables with default columns Name, Quantity, Set, Rarity, Condition, Purchase price, and Market price; Collection tables with the same seven; and search tables with the search defaults in the [*Table columns reference*](#table-columns-reference) (Name, Type, Attribute, Level/Rank/Link, ATK, DEF, Ban/points when a format is active). Market price uses YGOPRODeck card_prices.tcgplayer_price. | Must | Demo: at 1280 px Search/Lists/Collection open in Table; Lists and Collection show Name/Qty/Set/Rarity/Condition/Purchase/Market; search shows search defaults. |
| FR-73 | The system shall let the user add, remove, and reorder columns on search, Lists, and Collection desktop tables: any other field stored from the card API, printing, or published price snapshot (for example type, attribute, race, level/rank/link, ATK, DEF, archetype, passcode, ban/points, other price vendors) may be added from a header context menu (right-click) or an equivalent Columns control reachable by keyboard; columns are removable; columns reorder by drag; Name remains always available. The full table setup — visible columns, column order, column widths, active sort (column and direction), and active per-column filters — is remembered and restored the next time that table is opened, keyed per table (search, each List, Collection); signed-in users sync the setup on the profile (profiles.table_column_prefs); guests and signed-out sessions use localStorage as fallback. | Must | Demo: right-click header → add ATK; set sort Market desc and filter Set; drag Quantity; resize Name; leave and reopen the same List — columns, order, widths, sort, and filter restore; signed-in user sees the same after reload on another browser session. |
| FR-74 | The system shall let the user filter rows by a per-column filter on search, Lists, and Collection desktop tables. | Must | Test: filter Set contains SAMPLE; only matching rows remain; clear restores all. |
| FR-75 | The system shall store an optional purchase price (USD, nullable) on each collection item and each want-list item — the amount the user paid, entered by them. On want-list check-off, the user may optionally copy that purchase price onto the matching collection item. Deck value summaries inherit purchase price from matching collection items (same card/printing); decks do not store a separate per-entry purchase price. Market price always comes from the published TCGplayer snapshot (card_prices.tcgplayer_price). | Must | Test: set purchase_price 4.50 on a list item; check off with copy → collection item has 4.50; deck Paid uses collection matches; market column still shows tcgplayer_price. |

### 6.4 Value summaries and item condition

Collections, Lists, and Decks track current market value, amount paid, and profit/loss when the user entered purchase prices (approved 2026-10-28). Decks inherit paid/my_value from matching collection cards (REC-VALUE-02). Optional per-item my_value overrides market in totals when set (REC-VALUE-01). Condition and variant flags are user attributes; the API market price does not auto-adjust for them.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-76 | The system shall show on Collection, each List, and each Deck a value summary — the only place price totals and profit/loss appear (the toolbar count line above Search, Lists, and Collection results shows the same live card-count format as search, updating as filters apply, with no price estimate or vendor/API caption). Purchase price and Market price columns are per-unit amounts. Total current value = sum(effective_unit × quantity) over all rows, where effective_unit is my_value when set, otherwise card_prices.tcgplayer_price. For decks, purchase_price and my_value come from matching collection items (no per-deck-entry price fields). Total paid = sum(purchase_price × quantity) only over rows that have a purchase price. Profit/loss = sum(market_price × quantity) over those same priced rows − Total paid (negative when underwater). A priced-count label such as “12 of 40 priced” is shown. Rows without purchase price contribute to Total current value but not to Total paid or Profit/loss. | Must | Demo: collection rows with known per-unit market/purchase and qtys; Current, Paid, and P/L match the formulas; clearing a purchase price updates Paid, P/L, and priced count. |
| FR-77 | The system shall let the user set per item on collection, want-list, and deck entries: Condition (Near Mint, Lightly Played, Moderately Played, Heavily Played, Damaged, or unset) and variant/notes flags (at least: EU print, 1st Edition, Faded/misprint) plus an optional free-text note; Condition and variant columns are addable on Lists and Collection tables (default off except Condition, which defaults on for Collection). | Must | Test: set Lightly Played + EU on a collection row; add Condition column; values persist; market price unchanged. |
| FR-78 | The system shall support an optional per-item my_value (USD, nullable) on collection and want-list items; when set, Total current value and Profit/loss use my_value × quantity for that item instead of market × quantity; when null, market price is used. Deck summaries inherit my_value from matching collection items. | Must | Test: set my_value 10 on a collection row whose market is 4; summary Current uses 10×qty for that item; clear my_value and Current uses market again. |

### 6.5 Card detail

The detail view is the single-card lookup for text, art, legality, and price.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-09 | The system shall open a detail view with name, text, type line, and stats for the selected card. | Must | Test: open a Monster, Spell, and Trap. |
| FR-10 | The system shall show the card's artwork from site-hosted images. | Must | Inspection: image URL is on the OTCP origin. |
| FR-11 | The system shall show the card's ban or Genesys point status in the active format. | Must | Test: Forbidden in Edison; points in Genesys. |

### 6.6 Formats and banlists

Formats are curated. Format Library is the UX reference only; data is hand-curated (OD-01). Must formats are listed in the Formats reference.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-12 | The system shall list every Must format in the [*Formats reference*](#formats-reference). | Must | Inspection: compare the list with the reference. |
| FR-13 | The system shall limit a format's card pool per that format's pool rule in the [*Formats reference*](#formats-reference). | Must | Test: a later-set card is excluded from Edison. |
| FR-14 | The system shall apply each format's Forbidden, Limited, and Semi-Limited lists in search, detail, and the deck builder. | Must | Test: a Forbidden card cannot be added beyond zero copies. |
| FR-15 | The system shall treat Advanced Forbidden cards as Limited when Traditional is active. | Must | Test: one copy of an Advanced-Forbidden card is allowed; two are refused. |
| FR-16 | The system shall limit Speed Duel to the Speed Duel card pool and Speed Duel deck sizes in the [*Deck rules reference*](#deck-rules-reference). | Must | Test: a non-Speed-Duel card is excluded; Main max is 30. |
| FR-17 | The system shall support Skill cards for Speed Duel: at most one active Skill, not counted toward Main size, and included in YDK under `#main` per YGOPRODeck. | Must | Test: one Skill; second refused; YDK `#main` contains the Skill id. |
| FR-18 | The system shall enforce Genesys rules: no Link or Pendulum; combined Main, Extra, and Side points against the active cap. | Must | Test: a Link monster is refused; over-cap deck shows an error. |
| FR-19 | The system shall show each card's Genesys points, the running deck total, a default cap of 100, and a control to set a custom cap. | Must | Test: default cap 100; set 50; over-cap flags; Ash Blossom adds its points. |
| FR-20 | The system shall include Edison with its curated March 2010 banlist and pool cutoff. | Must | Demo: select Edison; banlist and pool match the snapshot. |

### 6.7 Deck builder

Players build decks for a chosen format. Guests can build and export without an account.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-21 | The system shall create a new empty deck bound to a selected format. | Must | Test: new deck shows Main, Extra, and Side empty. |
| FR-22 | The system shall add and remove cards from the open deck from the CardFinder in the deck editor, and from search or card detail. The deck editor shall support adding and removing via a quantity stepper (− qty +) in the CardFinder and editor rows and, on desktop, drag-and-drop into Main, Extra, or Side. | Must | Test: from the deck editor CardFinder, add three copies with the stepper, remove one; on desktop drag one card into Side. |
| FR-23 | The system shall place cards into Main, Extra, or Side per the [*Deck rules reference*](#deck-rules-reference). | Must | Test: an Extra Deck monster cannot sit in Main. |
| FR-24 | The system shall show live Main, Extra, and Side counts against the active format's size limits. | Must | Test: counts update on each add and remove. |
| FR-25 | The system shall flag copies that break the active format's banlist, points, or copy cap. | Must | Test: a Limited card at two copies shows an error. |
| FR-26 | The system shall apply the format-specific size and legality rows in the [*Deck rules reference*](#deck-rules-reference). | Must | Test: Speed Duel Main max 30; Advanced Main max 60. |
| FR-27 | The system shall let a guest build and export a deck without an account; the deck stays in the browser until the user signs in to save or share. | Must | Test: signed out, build and export YDK; save and share require sign-in. |

### 6.8 Deck export

Export covers file download and clipboard formats named in the reference.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-28 | The system shall download the open deck as a `.ydk` file per the [*Deck export formats reference*](#deck-export-formats-reference), including a Speed Duel Skill card under `#main` in YGOPRODeck's layout. | Must | Test: Speed Duel YDK lists the Skill id in `#main`; file opens in a YDK-aware tool. |
| FR-29 | The system shall copy the open deck to the clipboard in each option in the [*Deck export formats reference*](#deck-export-formats-reference). | Must | Test: paste each format into a text editor. |
| FR-30 | The system shall name the downloaded file from the deck name, sanitized for the filesystem. | Should | Test: rename deck, export; filename matches. |
| FR-31 | The system shall import a `.ydk` file in YGOPRODeck's layout, mapping a Skill card id in `#main` to the Speed Duel Skill slot, and refuse oversize, non-UTF-8, or unknown-id files with a clear reason. | Must | Test: import a Speed Duel YDK with a Skill in `#main`; Skill and Main counts match; unknown id refused. |

### 6.9 Accounts

Accounts exist so players can save and share decks. Backend is Supabase (OD-02). Auth methods are in the Auth methods reference.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-32 | The system shall let a user create an account with a method from the [*Auth methods reference*](#auth-methods-reference). | Must | Demo: create an account on Supabase Auth. |
| FR-33 | The system shall sign a user in and restore their session on return to the site. | Must | Test: sign in, reload, still signed in. |
| FR-34 | The system shall sign the user out and clear the local session. | Must | Test: after sign out, saved decks are inaccessible. |
| FR-35 | The system shall let a signed-in user delete their account and personal decks, want lists, and collection immediately on confirmed request, with no grace period. | Must | Test: delete; account cannot sign in; live decks and shares gone at once. |

### 6.10 Saved decks

Saved decks belong to the signed-in user.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-36 | The system shall save the open deck only for a signed-in user, to that user's account. | Must | Test: guest save prompts sign-in; after sign-in, save lists the deck. |
| FR-37 | The system shall list the user's saved decks with name, format, and last updated time. | Must | Demo: two saved decks appear. |
| FR-38 | The system shall open a saved deck for editing. | Must | Test: load, change one card, save. |
| FR-39 | The system shall rename a saved deck. | Should | Test: rename and confirm in the list. |
| FR-40 | The system shall delete a saved deck after confirmation. | Must | Test: cancel leaves it; confirm removes it. |

### 6.11 Deck sharing

Sharing lets another player view a deck without editing it. Mechanism per OD-07 and the Sharing reference.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-41 | The system shall create a share link only for a signed-in owner's saved deck, per the [*Sharing reference*](#sharing-reference). | Must | Test: guest cannot share; owner creates link; opens read-only. |
| FR-42 | The system shall open a valid share link as a read-only deck view without requiring the viewer's account. | Must | Test: open in a private window. |
| FR-43 | The system shall let the owner revoke a share link so the old URL stops working. | Must | Test: revoke; link returns not found. |

### 6.12 Prices and store links

Prices refresh with the card-data pipeline (OD-03). TCGplayer's own API is not available to new developers.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-44 | The system shall show each price in the [*Price sources reference*](#price-sources-reference) on the card detail view when available. | Must | Inspection: sample cards show TCGplayer and at least one other vendor field. |
| FR-45 | The system shall offer a control that opens a store search or product page for the card, per the [*Price sources reference*](#price-sources-reference). | Must | Test: each listed store opens in a new tab. |

### 6.13 Card data and schema

OTCP owns the published card JSON. Upstream feeds are inputs to the build, not the runtime contract.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-46 | The system shall publish cards in an OTCP versioned schema with a shared core and a Yu-Gi-Oh! extension. | Must | Inspection: schema file and sample card validate. |
| FR-47 | The system shall pull free upstream card and set data at build time, then normalize and validate it into the schema. | Must | Test: pipeline fails closed on invalid records. |
| FR-48 | The system shall apply the hand-curated overrides file after upstream normalization. | Must | Test: an override changes one field in the published set. |
| FR-49 | The system shall ingest Genesys points from YGOPRODeck `genesys_points` at refresh and spot-check them against the Konami Genesys list. | Must | Test: Ash Blossom points match YGOPRODeck; a forced Konami diff is reported and not auto-applied. |
| FR-50 | The system shall expose only Yu-Gi-Oh! as a selectable game in v1. | Must | Demo: no other game switcher. |
| FR-51 | The system shall keep the shared core free of Yu-Gi-Oh!-only fields so another game can add an extension later. | Must | Inspection: core schema review. |

### 6.14 Refresh and images

Refresh is weekly plus manual. Images ship with the site.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-52 | The system shall run the card-data and image refresh at least once per week. | Must | Inspection: schedule configuration and last-run log. |
| FR-53 | The system shall support a manual trigger of the same refresh pipeline. | Must | Demo: trigger; new run appears in the log. |
| FR-54 | The system shall download card images during refresh and serve them from the site origin. | Must | Test: detail art URL is same-origin; no ygoprodeck.com image request at runtime. |
| FR-55 | The system shall require network access; it shall not offer an offline or installed PWA mode in v1. | Must | Inspection: no service worker install path for offline use. |

### 6.15 Card view modes

List and Grid apply wherever cards are shown. Choice is remembered per user.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-60 | The system shall let the user toggle List (thin row: small card thumbnail about 32–40 CSS px wide at card aspect ratio, name, one row of game-declared icons — for Yu-Gi-Oh!: attribute, typing/race or Spell/Trap type + property, level/rank star with number, then separated ATK (Master Duel sword icon) and DEF (Master Duel shield icon) values (Link: ATK + rating, no DEF) — plus a format-gated ban marker using Master Duel limit icons (Limited 1, Semi-Limited 2, Forbidden; Unlimited/3 never shown on list or grid) with accessible full-word label — on List the ban icon sits inline at the end of the icon row after a thin divider following ATK/DEF; on Grid it overlays the top-left corner of the card art — ban markers appear on search, browse, collection, and Lists only when a format filter is active, and always in deck views where the deck format applies; no effect text) and Grid (card images only; ban status when a format is in context, and copy count as overlay badges; name on hover or long-press) on search results, decks, banlists, format card pools, Lists, and the collection; remember the choice in localStorage and, when signed in, on the profile; defaults: Grid for search and deck on desktop, last choice elsewhere; phone grids use at least 3 columns between 360 and 430 CSS px (4+ on wider phones/tablets) with tap targets at least 44 CSS px. List-row icons come from the active game extension (ADR-012); Yu-Gi-Oh! uses the official Konami attribute/typing/level/property symbols. | Must | Demo: toggle List/Grid on search and deck at 390 and 1280; Table on search/Lists/collection at 1280; List rows show thumbnail + official YGO icons; reload keeps the choice; phone grid shows at least 3 columns. |

### 6.16 Want lists

Named lists of cards the user plans to buy (for example a card-show trip). Guests keep them in the browser; sign-in saves or shares.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-61 | The system shall let the user create, rename, and delete want lists and add, edit, and remove items (card, quantity, optional set and rarity target, optional note, optional purchase price, condition, and variant flags). | Must | Test: create a list, add two cards with qty and a set target, rename, delete one entry. |
| FR-62 | The system shall show a running price total for a want list from the published YGOPRODeck card_prices.tcgplayer_price snapshot (TCGplayer). | Must | Test: total equals sum of tcgplayer_price times quantities for listed entries. |
| FR-63 | The system shall let the user mark want-list entries acquired and optionally add those printings to the collection, optionally copying the want-list purchase price onto the new collection item. | Must | Test: check off an entry; choose Add to collection with copy purchase; collection gains the qty/printing and purchase_price. |
| FR-64 | The system shall create and revoke a read-only share link for a saved want list using the same sharing rules as decks in the [*Sharing reference*](#sharing-reference). | Must | Test: guest cannot share; owner creates link; opens read-only; revoke fails the old URL. |
| FR-65 | The system shall export a want list to TCGplayer Mass Entry and plain text. | Must | Test: clipboard paste matches qty and names. |

### 6.17 Collection

Basic owned-card tracking with purchase price, condition/variants, and value summary in v1. Graded slabs, value-history charts, and imports from other apps' formats stay out of v1.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-66 | The system shall let the user record owned cards with quantity and printing (set code and rarity), an optional purchase price (USD), edit quantities and purchase price, and remove entries. | Must | Test: add a printing qty 2 with purchase_price; change qty to 1; edit price; remove. |
| FR-67 | The system shall let the user add to the collection from the CardFinder in the collection editor, and from search, card detail, or a deck. | Must | Demo: add from CardFinder, search, detail, and a deck. |
| FR-68 | The system shall support bulk import of collection lines from plain text. | Should | Test: paste Qty Name [SET] lines; unknown names refused with a reason. |
| FR-69 | The system shall show owned and missing counts per card in the deck builder against the collection, and offer to add missing cards to a want list. | Must | Test: with one owned copy and deck needing three, missing shows 2; Add missing creates want-list entries. |
| FR-70 | The system shall let a guest keep want lists and the collection in the browser; sign-in is required to save them to an account or share a want list. | Must | Test: signed out, edit want list and collection locally; save/share require sign-in. |

### 6.18 In-editor CardFinder

Reusable add-cards finder shared by the deck, list (want list), and collection editors so users are not forced through the full Search page.

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| FR-71 | The system shall provide a reusable CardFinder in the deck editor, list (want list) editor, and collection editor: a search field; a Filters control that opens the same faceted filter component used on Search (sidebar section or popover on desktop; drawer/sheet on phone); and results in compact list rows or a small grid. Each result shall expose a quantity stepper (− qty +) showing the current in-deck / on-list / owned count (minus disabled or hidden when the count is 0). On viewports around 1280 CSS px the finder shall appear in a left panel about 360–400 CSS px beside the editor; on phone the editor remains primary and an Add cards control opens the finder as a bottom sheet (half height, expandable to full). Ban markers in the finder shall follow the open deck's or list's format — inline after ATK/DEF on list results, top-left on grid art. Quantity steppers in the editor rows shall adjust copies already present; phone deck editor shall keep a sticky Main/Extra/Side count and legality summary. Deck, list, and collection editor rows shall share one table style (− qty +, name, inline ban, row container) with each editor's extra fields (price/total and check-off for lists; printing for collection) in that pattern. | Must | Demo: add from CardFinder on deck, list, and collection at 390 and 1280; Filters in finder matches Search facets; ban icons match deck format; steppers show current counts. |

**UNVERIFIED:** Curated banlist snapshots for Goat, HAT, and Tengu are not yet written into the repo. Check each Must historical format against its primary source before release.

## 7. Non-functional requirements

Each line has a condition, a measure, one priority, and a verification method. Numbers are targets until measured.

### 7.1 Performance

| ID | Category | Requirement | Priority | Verification |
|---|---|---|---|---|
| NFR-01 | Performance | The system shall show search results within 100 ms of the last keystroke after the index is loaded, on the reference phone (target). | Must | Test: input-latency timing on the reference phone. |
| NFR-02 | Performance | The system shall complete first load of the home experience within 2 s on the reference phone on a typical mobile network (target). | Must | Test: Lighthouse or timed navigation on the reference phone. |

Numbers are targets until measured on the reference phone. Index load may be separate from first paint; the 100 ms clock starts after the index is ready.

**UNVERIFIED:** Whether 100 ms after keystroke (name search and filter + facet-count refresh) is achievable for the full Yu-Gi-Oh! card index on the reference phone depends on index size and bitset facet implementation. Check with spike S-01 in the architecture.

### 7.2 Security and privacy

| ID | Category | Requirement | Priority | Verification |
|---|---|---|---|---|
| NFR-03 | Security | The system shall serve the app and API only over HTTPS. | Must | Inspection: production URLs. |
| NFR-04 | Security | The system shall store credentials and decks only through Supabase (OD-02), never in a public static bucket as plaintext secrets. | Must | Analysis: architecture review of storage. |
| NFR-05 | Security | The system shall not request card images from YGOPRODeck (or other upstream image hosts) in the browser at runtime. | Must | Test: network log during browse and detail. |
| NFR-06 | Privacy | The system shall store only the account and deck fields listed in section 9. | Must | Inspection: data model vs. section 9. |
| NFR-07 | Privacy | The system shall hard-delete the account and personal decks, want lists, and collection from the live store immediately on confirmed request; only provider backups may remain until they age out within 30 days. | Must | Test: delete account; live rows gone at once; document backup retention within 30 days. |

Price and store links open third-party sites; those sites have their own privacy policies. OTCP does not embed third-party checkout.

### 7.3 Reliability

| ID | Category | Requirement | Priority | Verification |
|---|---|---|---|---|
| NFR-08 | Reliability | The system shall publish a refresh only if validation passes; the previous published dataset remains live on failure. | Must | Test: inject an invalid record; site still serves the prior set. |

### 7.4 Usability and accessibility

| ID | Category | Requirement | Priority | Verification |
|---|---|---|---|---|
| NFR-09 | Usability | The system shall meet WCAG 2.2 Level AA for the pages in the [*Screen map reference*](#screen-map-reference). | Must | Analysis: axe or equivalent plus manual checks. |
| NFR-10 | Usability | The system shall make every interactive control reachable and operable by keyboard alone. | Must | Test: run UC-01, UC-05, and UC-06 by keyboard only. |
| NFR-11 | Usability | The system shall not convey ban status, errors, or selection by color alone. | Must | Inspection: Forbidden also has text or an icon. |
| NFR-12 | Usability | The system shall present a first-class layout at 375 CSS pixels wide without horizontal scrolling of primary content. | Must | Inspection: screenshots at 375 and 1280 px. |
| NFR-13 | Usability | The system shall use a clean, minimal, monochrome-leaning chrome so card art supplies most color. | Should | Demo: compare chrome contrast to card art. |

### 7.5 Maintainability

| ID | Category | Requirement | Priority | Verification |
|---|---|---|---|---|
| NFR-14 | Maintain. | The system shall keep schema validation, deck export encoding, and format rules in modules testable without a browser. | Must | Inspection: unit tests run headless. |
| NFR-15 | Maintain. | The system shall cover schema validation and deck export with at least 80% line coverage (target). | Should | Analysis: coverage report. |

### 7.6 Portability

| ID | Category | Requirement | Priority | Verification |
|---|---|---|---|---|
| NFR-16 | Portability | The system shall support the current stable releases of Chrome, Firefox, Safari, and Edge on desktop and mobile. | Must | Test: smoke of UC-01 and UC-05 on each. |

### 7.7 Compliance

| ID | Category | Requirement | Priority | Verification |
|---|---|---|---|---|
| NFR-17 | Compliance | The system shall keep project docs as Markdown under `docs/` plus Word and PDF copies named `Plong_OTCP_*.docx` / `.pdf`. | Must | Inspection: docs folder. |
| NFR-18 | Compliance | The system shall show third-party notices for libraries and data sources in an About or Notices page. | Must | Inspection: each listed dependency has a notice. |

## 8. Use cases

One use case per key user goal. Related requirement IDs use the keys resolved in this build.

### UC-01: Search for a card mid-game

| Field | Content |
|---|---|
| Primary actor | Player |
| Goal | Find a card's text quickly during play. |
| Preconditions | OTCP is open; the card index is loaded. |
| Main flow | 1. User focuses the search field.<br>2. User types part of a card name.<br>3. System shows matching cards within the performance target.<br>4. User opens one result.<br>5. System shows the detail view with text and art. |
| Expected result | The chosen card's text and art are visible. |
| Alternatives / errors | 2a. No matches: system shows an empty state.<br>3a. Index still loading: system shows a loading state and does not start the 100 ms clock. |
| Related requirements | FR-01, FR-02, FR-09, FR-10, NFR-01, NFR-10 |

### UC-02: Filter cards and compare them in a table

| Field | Content |
|---|---|
| Primary actor | Player |
| Goal | Narrow the catalog and compare stats. |
| Preconditions | OTCP is open; a format may be selected. |
| Main flow | 1. User selects a format.<br>2. User applies filters from the [*Filter fields reference*](#filter-fields-reference).<br>3. User switches to table view.<br>4. System shows sortable columns.<br>5. User sorts by ATK descending. |
| Expected result | The table shows only cards matching the format and filters, sorted as requested. |
| Alternatives / errors | 2a. User clears filters: full format pool returns. |
| Related requirements | FR-04, FR-05, FR-06, FR-07, FR-13, FR-14 |

### UC-03: Check a card's price and open a store

| Field | Content |
|---|---|
| Primary actor | Player or Collector |
| Goal | See recent prices and buy or compare on a store site. |
| Preconditions | A card detail view is open; prices were published in the last refresh. |
| Main flow | 1. User views the Prices section.<br>2. System shows each available vendor price from the [*Price sources reference*](#price-sources-reference).<br>3. User chooses Open on TCGplayer.<br>4. System opens the store search or product page in a new tab. |
| Expected result | Prices are visible; the store page opened for that card. |
| Alternatives / errors | 2a. A vendor price is missing: that row shows Unavailable. |
| Related requirements | FR-44, FR-45 |

### UC-04: Browse Edison format legality

| Field | Content |
|---|---|
| Primary actor | Player |
| Goal | See which cards are legal and limited in Edison. |
| Preconditions | OTCP is open. |
| Main flow | 1. User opens Formats and selects Edison.<br>2. System sets the card pool and banlist for Edison.<br>3. User searches a Forbidden card.<br>4. System shows Forbidden status in results and detail. |
| Expected result | Edison pool and banlist are active. |
| Alternatives / errors | 1a. Format data missing: system says the format is unavailable. |
| Related requirements | FR-11, FR-12, FR-13, FR-14, FR-20 |

### UC-05: Build a deck for a format

| Field | Content |
|---|---|
| Primary actor | Player |
| Goal | Assemble a legal deck list. |
| Preconditions | A format is selected. |
| Main flow | 1. User creates a new deck.<br>2. User adds cards from search to Main, Extra, and Side.<br>3. System updates counts and flags banlist violations.<br>4. User fixes a Limited-card overcount. |
| Expected result | The deck meets section counts and banlist rules, or remaining errors are visible. |
| Alternatives / errors | 2a. Guest user: deck stays in the browser until export or sign-in to save or share.<br>3a. Extra Deck card dropped on Main: system refuses and says why. |
| Related requirements | FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-27, FR-71 |

### UC-06: Export a deck for a simulator or store

| Field | Content |
|---|---|
| Primary actor | Player |
| Goal | Take the deck into YGOPro/EDOPro or TCGplayer Mass Entry. |
| Preconditions | A deck with at least one card is open. |
| Main flow | 1. User chooses Export.<br>2. User downloads `.ydk`.<br>3. User copies YDKE to the clipboard.<br>4. User copies TCGplayer Mass Entry lines to the clipboard. |
| Expected result | File and clipboard contents match the [*Deck export formats reference*](#deck-export-formats-reference). |
| Alternatives / errors | 2a. Deck has validation errors: system warns but still allows export (user choice). |
| Related requirements | FR-17, FR-28, FR-29, FR-31 |

### UC-07: Create an account and save a deck

| Field | Content |
|---|---|
| Primary actor | Player |
| Goal | Keep a deck across devices. |
| Preconditions | A guest deck is open; Supabase is configured. |
| Main flow | 1. User creates an account with a method from the [*Auth methods reference*](#auth-methods-reference).<br>2. System signs the user in.<br>3. User saves the open deck.<br>4. User signs out and signs in on another browser.<br>5. System lists and opens the saved deck. |
| Expected result | The deck is stored on the account and editable after sign-in. |
| Alternatives / errors | 1a. Auth fails: system shows the error; guest deck remains. |
| Related requirements | FR-32, FR-33, FR-36, FR-37, FR-38, NFR-04 |

### UC-08: Share a saved deck

| Field | Content |
|---|---|
| Primary actor | Player |
| Goal | Let a friend view the deck read-only. |
| Preconditions | A saved deck exists; user is signed in. |
| Main flow | 1. User creates a share link.<br>2. User sends the link to a friend.<br>3. Friend opens the link while signed out.<br>4. System shows the read-only deck. |
| Expected result | The friend sees the deck and cannot edit or delete it. |
| Alternatives / errors | 4a. Link revoked or invalid: system shows not found. |
| Related requirements | FR-41, FR-42, FR-43 |

### UC-09: Build a Genesys deck under the point cap

| Field | Content |
|---|---|
| Primary actor | Player |
| Goal | Stay within the Genesys point cap while building. |
| Preconditions | Genesys is selected; point data is published. |
| Main flow | 1. User creates a Genesys deck.<br>2. User adds cards; system shows running points.<br>3. User tries a Link monster; system refuses.<br>4. User exceeds the cap; system flags the deck. |
| Expected result | Point total and legality errors are visible; Link/Pendulum excluded. |
| Alternatives / errors | 2a. User sets a custom cap: totals and flags use that cap. |
| Related requirements | FR-18, FR-19, FR-25, FR-26, FR-49 |

### UC-10: Build a Speed Duel deck with a Skill

| Field | Content |
|---|---|
| Primary actor | Player |
| Goal | Build a legal Speed Duel list with one Skill. |
| Preconditions | Speed Duel is selected. |
| Main flow | 1. User creates a Speed Duel deck.<br>2. User adds Main cards within 20–30.<br>3. User selects one Skill card.<br>4. User tries a second active Skill; system refuses. |
| Expected result | Deck sizes and one Skill rule are enforced; non-Speed-Duel cards are excluded; YDK round-trips the Skill under `#main`. |
| Alternatives / errors | 2a. Non-Speed-Duel card: system refuses and says why. |
| Related requirements | FR-16, FR-17, FR-25, FR-26, FR-28, FR-31 |

### UC-11: Build and share a want list for a show

| Field | Content |
|---|---|
| Primary actor | Player |
| Goal | Track cards to buy with a running price total and optionally share the list. |
| Preconditions | Card index is loaded. |
| Main flow | 1. User creates a named want list.<br>2. User adds cards with quantities and optional set/rarity targets.<br>3. System shows a running snapshot price total.<br>4. User checks off an acquired card and adds it to the collection.<br>5. Signed-in user exports Mass Entry and creates a share link. |
| Expected result | List totals match the snapshot; acquired cards can land in the collection; share is read-only. |
| Alternatives / errors | 5a. Guest: export works; share and cloud save require sign-in. |
| Related requirements | FR-60, FR-61, FR-62, FR-63, FR-64, FR-65, FR-70, FR-71 |

### UC-12: Track owned printings

| Field | Content |
|---|---|
| Primary actor | Player |
| Goal | Record what they own and see gaps in a deck. |
| Preconditions | User has a deck open or is browsing search/detail. |
| Main flow | 1. User adds a printing from card detail.<br>2. User opens the collection in Grid, List, or Table (desktop).<br>3. User opens the deck builder and sees owned/missing badges.<br>4. User adds missing cards to a want list. |
| Expected result | Collection quantities drive owned/missing; missing can feed a want list. |
| Alternatives / errors | 1a. Should: bulk import from plain text when built. |
| Related requirements | FR-60, FR-66, FR-67, FR-68, FR-69, FR-71 |

### UC-13: Fill gaps from a deck into a want list

| Field | Content |
|---|---|
| Primary actor | Player |
| Goal | See which deck cards they lack and queue them to buy. |
| Preconditions | Collection has some printings; a deck is open. |
| Main flow | 1. User opens the deck builder with owned/missing indicators.<br>2. User chooses Add missing to want list.<br>3. System creates or updates want-list entries for missing quantities. |
| Expected result | Want list reflects missing counts from the deck vs collection. |
| Alternatives / errors | 2a. No missing cards: action is disabled or no-ops with a message. |
| Related requirements | FR-61, FR-69 |

## 9. Data requirements

| Entity | Fields | Stored in | Retention | Privacy |
|---|---|---|---|---|
| Card (published) | Schema version, game id, core fields, Yu-Gi-Oh! extension, image paths, price snapshot, set membership, genesys points, format tags | Static site dataset | Replaced each successful refresh | Public game data |
| Format | Id, name, pool rule, banlist or point mode, size rules, source notes | Hand-curated in repo; published with dataset | Until edited | Public |
| Overrides | Card id, field, value, reason | Hand-curated file in repo | Until edited | Public |
| Account | User id, email or OAuth subject, created time | Supabase (OD-02) | Until user deletes account (hard-deleted immediately; provider backups within 30 days) | Personal |
| Saved deck | Deck id, owner id, deckSchemaVersion, name, format id, main/extra/side as repeated card ids (value summary inherits purchase_price/my_value from matching collection items), skill id if any, genesys cap | Supabase (OD-02) or browser for guests | Until user deletes deck or account | Personal |
| Want list | List id, owner id, name, updated time | Supabase (OD-02) or browser for guests | Until user deletes list or account | Personal |
| Want list item | Item id, list id, card id, quantity, optional set/rarity target, note, acquired flag, optional purchase_price (USD — what the user paid; optional copy to collection on check-off), condition, variant flags, optional my_value | Supabase (OD-02) or browser for guests | With parent list | Personal |
| Collection item | Item id, owner id, card id, quantity, set code, rarity, optional purchase_price (USD), condition, variant flags, optional my_value | Supabase (OD-02) or browser for guests | Until user deletes item or account | Personal |
| Share link | Token hash (raw token never stored), target kind (deck\|want_list), target id, created time, revoked time | Supabase (OD-02) | Until revoked or parent/account deleted | Personal (indirect) |
| View preference | List/Grid/Table (Table on search, Lists, collection desktop ≥~640) last choice | localStorage; profile when signed in | Until cleared or account deleted | Personal (preference) |
| Table column layout | Per-table full setup: visible columns, order, widths, sort, active column filters (search; each List; Collection) | localStorage; profiles.table_column_prefs when signed in | Until cleared or account deleted | Personal (preference) |
| Refresh log | Run id, start/end, status, counts, error summary | CI or backend logs | At least 90 days (target) | Operational |

- Guest decks, want lists, and collection live only in browser storage; they are not personal data on the server and are not covered by OD-10. They last until the user clears site data, imports after sign-in, or overwrites the draft slot.
- Share links use a high-entropy secret shown once; the server stores only a hash. Multiplicity in saved decks uses repeated card ids.
- Prices are a snapshot from the last successful refresh, not a live websocket feed (OD-03).
- Null price means unavailable from upstream for that vendor at refresh time; it is not zero.
- Passcodes are integers; display may zero-pad to eight digits. Skill cards may use non-passcode ids from upstream.
- Genesys points are stored on the card from YGOPRODeck at refresh; the deck builder sums Main + Extra + Side against the active cap (default 100, user-settable).

## 10. External interfaces

### 10.1 User interface and accessibility

- Screens in the [*Screen map reference*](#screen-map-reference); keyboard paths covered by NFR-10.
- Visual tone: clean, minimal, monochrome-leaning chrome; card art supplies color (NFR-13).

### 10.2 Hardware

Keyboard, pointer, and touch. No special hardware.

### 10.3 Software and APIs

| Interface | Used for | License / terms | Source |
|---|---|---|---|
| YGOPRODeck API v7 | Upstream cards, sets, prices, Speed Duel pool, Skill cards, genesys_points, image URLs at build time | Free public API; follow their rate and image rules | ygoprodeck.com/api-guide |
| Konami Genesys page | Official Genesys rules and point list (EN) | Publisher site; hand-curate or compare | yugioh-card.com/en/genesys/ |
| Vite, React, TypeScript, Tailwind | Client shell (OD-04) | MIT (typical; verify each package) | PR #1; OD-04 |
| Vitest, Playwright | Unit and end-to-end tests (OD-04) | MIT (typical; verify) | PR #1; OD-04 |
| Supabase | Auth and deck storage (OD-02) | Vendor terms | OD-02 |

**UNVERIFIED:** Exact third-party package licenses for the PR #1 stack are not re-checked in this draft. Verify each npm license before release. TCGplayer new API access remains closed as of October 27, 2026.

### 10.4 Communications

Browsers load the static app and call Supabase for auth and decks over HTTPS. Store links open third-party sites. CI jobs call upstream APIs during refresh only.

## 11. Open decisions

Open items use the proposed default until decided. Decided items show the date.

| ID | Question | Options | Proposed default | Status |
|---|---|---|---|---|
| OD-01 | How are historical formats and banlists sourced? | A) Hand-curate format catalog + banlist snapshots; YGOPRODeck for cards/sets/dates; Format Library as UX reference only. B) License or partner with Format Library if they grant data use. C) Rely on a third-party banlists API (incomplete past 2020). | A — hand-curate; Format Library UX only; no scrape. | Decided 2026-10-27 |
| OD-02 | Where do accounts and saved decks live? | A) Supabase (Auth + Postgres) free tier. B) Firebase Auth + Firestore. C) Custom small API on a VPS. D) Defer accounts. | A — Supabase for auth and deck DB; static UI on GitHub Pages or the same host. | Decided 2026-10-27 |
| OD-03 | What does "live" prices mean in v1? | A) YGOPRODeck `card_prices` refreshed weekly + manual; store search links. B) Separate daily price-only job. C) Direct TCGplayer API (not available). | A — weekly (and manual) YGOPRODeck prices; outbound store links; no TCGplayer API. | Decided 2026-10-27 |
| OD-04 | Which client stack ships? | A) Accept PR #1 (Vite 7, React 19, TypeScript, Tailwind 4, Vitest, Playwright). B) Replace parts after architecture spikes. | A — Vite, React, TypeScript, Tailwind, Vitest, Playwright. | Decided 2026-10-27 |
| OD-05 | Which formats ship in v1? | A) Current TCG + Edison only. B) Advanced, Traditional, Speed Duel, Genesys, Goat, Edison, HAT, Tengu as Must; others later. C) Full Format Library catalog. | B — Must set as listed; all other formats Could/later (e.g. TeleDAD). | Decided 2026-10-27 |
| OD-06 | Which sign-in methods? | A) Email/password only. B) Email/password + Google OAuth. C) Magic link only. | B — email/password + Google OAuth. | Decided 2026-10-27 |
| OD-07 | How does deck sharing work? | A) Public read-only link with opaque id; owner can revoke. B) Share code typed into the app. C) Export-only. | A — public read-only opaque link; owner can revoke. | Decided 2026-10-27 |
| OD-08 | Which vendor prices and links are shown? | A) TCGplayer, CoolStuffInc, Cardmarket from YGOPRODeck fields. B) TCGplayer only. C) Add eBay/Amazon. | A — TCGplayer, CoolStuffInc, and Cardmarket. | Decided 2026-10-27 |
| OD-09 | What is the public site base path? | A) GitHub Pages project site at `/otcp/`. B) Custom domain at `/`. | A — `/otcp/` unless a custom domain is chosen later. | Decided 2026-10-27 |
| OD-10 | How soon after account deletion are personal decks removed? | A) Within 30 days. B) Immediate hard delete. C) 90 days. | B — immediate hard delete of live account and deck rows on confirmed request; only provider backups age out within 30 days. No grace period. | Decided 2026-10-27 |
| OD-11 | Where do Genesys point values come from at refresh? | A) YGOPRODeck `misc_info.genesys_points` in bulk; spot-check against Konami EN list; report diffs, do not auto-apply them. B) Konami page only (hand entry). C) YGOPRODeck only with no spot-check. | A — YGOPRODeck bulk; Konami spot-check each refresh; diffs reported, not auto-applied. | Decided 2026-10-27 |
| OD-12 | What is the default Genesys point cap in the deck builder? | A) Fixed 100. B) Default 100 with a user-settable custom cap. C) No default; user must pick. | B — default 100; user may set a custom cap. | Decided 2026-10-27 |

## 12. Acceptance criteria

Each check runs end to end against a published build and the chosen backend.

| ID | Check | Verifies |
|---|---|---|
| AC-01 | On the reference phone with index loaded, type a unique substring; the matching card appears within 100 ms of the last keystroke (target). | FR-01, FR-02, NFR-01 |
| AC-02 | Select Yu-Gi-Oh!; apply core and game-specific facets with visible option counts; confirm chips and Clear all; at 1280 px use Grid, List, and Table (sort by ATK in Table); at 390 px confirm at least 3-column Grid and List (no Table); clear restores the format pool. | FR-04, FR-05, FR-06, FR-07, FR-56, FR-57 |
| AC-03 | Open Monster, Spell, and Trap details; art is same-origin; ban status matches the active format. | FR-09, FR-10, FR-11, NFR-05 |
| AC-04 | Select Edison; a post-Edison card is absent; a March 2010 Forbidden card shows Forbidden and cannot be added. | FR-13, FR-14, FR-20, FR-25 |
| AC-05 | As a guest, build a legal Advanced deck, export YDK, and confirm Save and Share require sign-in; the deck remains in the browser until then. | FR-21, FR-22, FR-23, FR-24, FR-27, FR-36, FR-41, FR-71 |
| AC-06 | Export YDK, YDKE, TCGplayer Mass Entry, and plaintext per the [*Deck export formats reference*](#deck-export-formats-reference); re-import a Speed Duel YDK and recover the Skill from `#main`. | FR-17, FR-28, FR-29, FR-31 |
| AC-07 | Create account, save deck, sign out, sign in elsewhere, load deck; then delete account and confirm the account cannot sign in and live decks and shares are gone immediately. | FR-32, FR-35, FR-36, FR-38, NFR-07 |
| AC-08 | Create a share link; open read-only in a private window; revoke; old link fails. | FR-41, FR-42, FR-43 |
| AC-09 | Detail shows prices from the [*Price sources reference*](#price-sources-reference); each store control opens a third-party tab. | FR-44, FR-45 |
| AC-10 | Run manual refresh with a forced invalid card; published site keeps the previous dataset; fix and rerun publishes the new one. | FR-53, NFR-08 |
| AC-11 | After refresh, browse 20 cards under network capture; no requests to images.ygoprodeck.com. | FR-54, NFR-05 |
| AC-12 | First load of home within 2 s on the reference phone (target); record the measurement method. | NFR-02 |
| AC-13 | Complete UC-01, UC-05, and UC-06 by keyboard only; axe clean at WCAG 2.2 AA on primary screens. | NFR-09, NFR-10, NFR-11 |
| AC-14 | Smoke UC-01 and UC-05 on current Chrome, Firefox, Safari, and Edge (desktop and one mobile engine each where available). | NFR-12, NFR-16 |
| AC-15 | Published JSON validates against the versioned schema; shared core has no Yu-Gi-Oh!-only required fields. | FR-46, FR-48, FR-51 |
| AC-16 | In Traditional, add one Advanced-Forbidden card; a second copy is refused. | FR-15, FR-25 |
| AC-17 | In Genesys, refuse a Link monster; default cap 100; set a custom cap; flag over-cap; refresh reports a forced Konami point diff without auto-applying it. | FR-18, FR-19, FR-25, FR-49 |
| AC-18 | In Speed Duel, refuse a non-Speed-Duel card; allow one Skill; refuse a second; Main max 30; exported YDK lists the Skill under `#main` and imports back. | FR-16, FR-17, FR-26, FR-28, FR-31 |
| AC-19 | Toggle List and Grid on search at 390 and 1280; confirm List has no images and Grid has no under-tile text; reload keeps the choice in localStorage. | FR-60 |
| AC-20 | As a signed-in user, create a want list with qty and set target; see snapshot price total; check off one entry into the collection; export Mass Entry; create and revoke a share link. As a guest, edit a want list in the browser and confirm share requires sign-in. | FR-61, FR-62, FR-63, FR-64, FR-65, FR-70, FR-71 |
| AC-21 | Add a printing from detail; see owned/missing in the deck builder; add missing to a want list; bulk-import plain text when the Should is built. | FR-66, FR-67, FR-68, FR-69, FR-71 |
| AC-22 | At 1280 px on Lists and Collection: Table shows Name, Qty, Set, Rarity, Purchase price, Market price (Collection also Condition); on search: Table shows search defaults. Sort, filter, Columns/right-click add a field, reorder, resize; leave and reopen — full setup restores (search, that List, Collection each keyed); signed-in sync; phone has no Table. | FR-06, FR-07, FR-08, FR-72, FR-73, FR-74, FR-75, FR-77 |
| AC-23 | On Collection, a List, and a Deck: summary shows Current, Paid, P/L, and priced count; Paid/P/L only over items with purchase_price (decks inherit from matching collection cards); my_value overrides market for that item in Current/P/L; check-off can copy list purchase_price to collection; Condition/EU do not change market. | FR-75, FR-76, FR-77, FR-78 |

## 13. Future features

These are not requirements. Each is deferred for the reason given.

| Feature | Reason deferred |
|---|---|
| Opening-hand / draw / shuffle simulator | Out of scope for v1; focus stays on lookup and deck tools. |
| Other TCGs (Pokémon, Magic, One Piece, …) | Schema is designed for later games; v1 ships Yu-Gi-Oh! only. |
| Offline or PWA mode | Interview chose online only. |
| Could formats (TeleDAD and other Format Library eras) | Must set ships first; add later as curated snapshots. |
| Full Format Library catalog parity | Partnership or license would be needed for their data; no scrape. |
| Direct TCGplayer partner API / affiliate checkout | New API access closed; revisit if access opens. |
| Graded slabs, value-history charts, third-party collection importers | Condition/variants and value summary ship in v1; these stay future. |
| Imports from other apps' collection formats | Plain-text bulk import is Should; third-party format importers are future. |
| Rulings database and judge tools | Separate product surface. |

## 14. Traceability

Each requirement maps to the use cases and acceptance checks that cover it. Architecture elements are mapped in the architecture document.

| Requirement | Priority | Use cases | Acceptance | Method |
|---|---|---|---|---|
| FR-01 | Must | UC-01 | AC-01 | Test |
| FR-02 | Must | UC-01 | AC-01 | Test |
| FR-03 | Must | — | — | Test |
| FR-04 | Must | UC-02 | AC-02 | Inspection |
| FR-05 | Must | UC-02 | AC-02 | Test |
| FR-56 | Must | — | AC-02 | Inspection |
| FR-57 | Must | — | AC-02 | Test |
| FR-58 | Must | — | — | Test |
| FR-59 | Should | — | — | Test |
| FR-06 | Must | UC-02 | AC-02, AC-22 | Demo |
| FR-07 | Must | UC-02 | AC-02, AC-22 | Test |
| FR-08 | Must | — | AC-22 | Demo |
| FR-72 | Must | — | AC-22 | Demo |
| FR-73 | Must | — | AC-22 | Demo |
| FR-74 | Must | — | AC-22 | Test |
| FR-75 | Must | — | AC-22, AC-23 | Test |
| FR-76 | Must | — | AC-23 | Demo |
| FR-77 | Must | — | AC-22, AC-23 | Test |
| FR-78 | Must | — | AC-23 | Test |
| FR-09 | Must | UC-01 | AC-03 | Test |
| FR-10 | Must | UC-01 | AC-03 | Inspection |
| FR-11 | Must | UC-04 | AC-03 | Test |
| FR-12 | Must | UC-04 | — | Inspection |
| FR-13 | Must | UC-02, UC-04 | AC-04 | Test |
| FR-14 | Must | UC-02, UC-04 | AC-04 | Test |
| FR-15 | Must | — | AC-16 | Test |
| FR-16 | Must | UC-10 | AC-18 | Test |
| FR-17 | Must | UC-06, UC-10 | AC-06, AC-18 | Test |
| FR-18 | Must | UC-09 | AC-17 | Test |
| FR-19 | Must | UC-09 | AC-17 | Test |
| FR-20 | Must | UC-04 | AC-04 | Demo |
| FR-21 | Must | UC-05 | AC-05 | Test |
| FR-22 | Must | UC-05 | AC-05 | Test |
| FR-23 | Must | UC-05 | AC-05 | Test |
| FR-24 | Must | UC-05 | AC-05 | Test |
| FR-25 | Must | UC-05, UC-09, UC-10 | AC-04, AC-16, AC-17 | Test |
| FR-26 | Must | UC-05, UC-09, UC-10 | AC-18 | Test |
| FR-27 | Must | UC-05 | AC-05 | Test |
| FR-28 | Must | UC-06, UC-10 | AC-06, AC-18 | Test |
| FR-29 | Must | UC-06 | AC-06 | Test |
| FR-30 | Should | — | — | Test |
| FR-31 | Must | UC-06, UC-10 | AC-06, AC-18 | Test |
| FR-32 | Must | UC-07 | AC-07 | Demo |
| FR-33 | Must | UC-07 | — | Test |
| FR-34 | Must | — | — | Test |
| FR-35 | Must | — | AC-07 | Test |
| FR-36 | Must | UC-07 | AC-05, AC-07 | Test |
| FR-37 | Must | UC-07 | — | Demo |
| FR-38 | Must | UC-07 | AC-07 | Test |
| FR-39 | Should | — | — | Test |
| FR-40 | Must | — | — | Test |
| FR-41 | Must | UC-08 | AC-05, AC-08 | Test |
| FR-42 | Must | UC-08 | AC-08 | Test |
| FR-43 | Must | UC-08 | AC-08 | Test |
| FR-44 | Must | UC-03 | AC-09 | Inspection |
| FR-45 | Must | UC-03 | AC-09 | Test |
| FR-46 | Must | — | AC-15 | Inspection |
| FR-47 | Must | — | — | Test |
| FR-48 | Must | — | AC-15 | Test |
| FR-49 | Must | UC-09 | AC-17 | Test |
| FR-50 | Must | — | — | Demo |
| FR-51 | Must | — | AC-15 | Inspection |
| FR-52 | Must | — | — | Inspection |
| FR-53 | Must | — | AC-10 | Demo |
| FR-54 | Must | — | AC-11 | Test |
| FR-55 | Must | — | — | Inspection |
| FR-60 | Must | UC-11, UC-12 | AC-19 | Demo |
| FR-61 | Must | UC-11, UC-13 | AC-20 | Test |
| FR-62 | Must | UC-11 | AC-20 | Test |
| FR-63 | Must | UC-11 | AC-20 | Test |
| FR-64 | Must | UC-11 | AC-20 | Test |
| FR-65 | Must | UC-11 | AC-20 | Test |
| FR-66 | Must | UC-12 | AC-21 | Test |
| FR-67 | Must | UC-12 | AC-21 | Demo |
| FR-68 | Should | UC-12 | AC-21 | Test |
| FR-69 | Must | UC-12, UC-13 | AC-21 | Test |
| FR-70 | Must | UC-11 | AC-20 | Test |
| FR-71 | Must | UC-05, UC-11, UC-12 | AC-05, AC-20, AC-21 | Demo |
| NFR-01 | Must | UC-01 | AC-01 | Test |
| NFR-02 | Must | — | AC-12 | Test |
| NFR-03 | Must | — | — | Inspection |
| NFR-04 | Must | UC-07 | — | Analysis |
| NFR-05 | Must | — | AC-03, AC-11 | Test |
| NFR-06 | Must | — | — | Inspection |
| NFR-07 | Must | — | AC-07 | Test |
| NFR-08 | Must | — | AC-10 | Test |
| NFR-09 | Must | — | AC-13 | Analysis |
| NFR-10 | Must | UC-01 | AC-13 | Test |
| NFR-11 | Must | — | AC-13 | Inspection |
| NFR-12 | Must | — | AC-14 | Inspection |
| NFR-13 | Should | — | — | Demo |
| NFR-14 | Must | — | — | Inspection |
| NFR-15 | Should | — | — | Analysis |
| NFR-16 | Must | — | AC-14 | Test |
| NFR-17 | Must | — | — | Inspection |
| NFR-18 | Must | — | — | Inspection |

## References

Every list in the requirements points to one of these named tables.

### Filter fields reference

| Layer | Field | Control | Notes |
|---|---|---|---|
| Core (any TCG) | Name / rules text | Search | Substring on name and rules text; primary mid-game path |
| Core (any TCG) | Card category / type | Multi-select + include/exclude | Generic category before game-specific subtypes |
| Core (any TCG) | Set / expansion | Multi-select + search-within | Long lists: search-within and show-more |
| Core (any TCG) | Release date | Range | Bound to set release metadata when present |
| Core (any TCG) | Rarity | Multi-select | Core rarity labels from the schema |
| Core (any TCG) | Format legality / ban status | Multi-select | Relative to the selected format: in-pool, Forbidden, Limited, Semi-Limited, Unlimited |
| Core (any TCG) | Price range | Range | Uses published snapshot prices for the active currency column |
| Core (any TCG) | Has image | Toggle | Cards with hosted art vs placeholder |
| Yu-Gi-Oh! (extension) | Monster card type | Multi-select + include/exclude + AND/OR | Normal, Effect, Fusion, Synchro, Xyz, Link, Pendulum, Ritual, and related frames |
| Yu-Gi-Oh! (extension) | Spell / Trap subtype | Multi-select | Normal, Quick-Play, Continuous, Equip, Field, Counter, … |
| Yu-Gi-Oh! (extension) | Attribute | Multi-select | DARK, LIGHT, EARTH, WATER, FIRE, WIND, DIVINE |
| Yu-Gi-Oh! (extension) | Monster type / race | Multi-select + search-within | Spellcaster, Warrior, … |
| Yu-Gi-Oh! (extension) | Archetype | Multi-select + search-within | When present on the card |
| Yu-Gi-Oh! (extension) | Level / Rank / Link rating | Range | Numeric min–max |
| Yu-Gi-Oh! (extension) | ATK / DEF | Range | Numeric min–max; DEF ignored for Link where absent |
| Yu-Gi-Oh! (extension) | Pendulum scale | Range | When Pendulum data present |
| Yu-Gi-Oh! (extension) | Link arrows | Arrow picker | Multi-arrow include |
| Yu-Gi-Oh! (extension) | Genesys points | Range | When Genesys data present |
| Yu-Gi-Oh! (extension) | Speed Duel / Skill | Toggle / multi-select | Speed Duel pool and Skill cards |
| Yu-Gi-Oh! (extension) | Effect keywords | Multi-select + search-within | Should: when keyword tags exist on the card |
| Yu-Gi-Oh! (extension) | Passcode | Exact id | Eight-digit id; also available from the main search box |

### Table columns reference

Catalog sourced from YGOPRODeck cardinfo (misc=yes), e.g. Accesscode Talker and Dark Magician, plus Pendulum (scale, pend_desc) and Spell/Skill samples. Desktop Table is the default on Search, Lists, and Collection; phone uses compact icon rows (no Table). Search defaults: Name, Type, Attribute, Level/Rank/Link, ATK, DEF, Ban/points when a format is active. Lists and Collection defaults: Name, Quantity, Set, Rarity, Condition, Purchase price, Market price. set_price values 0 / 0.00 are shown blank (unknown), never as \$0.00. Link markers render with the Link marker icon. Grain Card = one row per card; Printing = depends on selected card_sets[] entry; User item = local/account field. Hidden rows are not offered in the Columns menu (FR-72, FR-73, UI-D9/D10).

| Column label | Source path | Grain | Tables | Availability | Notes |
|---|---|---|---|---|---|
| Name | name | Card | Search, Lists, Collection | Always on | Primary identity. |
| Quantity | user.quantity | User item | Lists, Collection | Default on Lists & Collection | Owned or wanted count. |
| Set | card_sets[].set_code (selected printing) / user.set | Printing | Lists, Collection | Default on Lists & Collection | Target or owned set code. |
| Rarity | card_sets[].set_rarity (selected printing) / user.rarity | Printing | Lists, Collection | Default on Lists & Collection | Also available: set_rarity_code. |
| Purchase price | user.purchase_price | User item | Lists, Collection | Default on Lists & Collection | USD nullable; what the user paid. |
| Market price | card_prices[].tcgplayer_price | Card | Search, Lists, Collection | Default on Lists & Collection; addable on Search | Published TCGplayer snapshot (D-04). |
| Type | type | Card | Search, Lists, Collection | Default on Search; addable elsewhere | e.g. Effect Monster, Spell Card, Skill Card. |
| Attribute | attribute | Card | Search, Lists, Collection | Default on Search; addable elsewhere | Blank on Spells/Traps/Skills. |
| Level/Rank/Link | level / linkval | Card | Search, Lists, Collection | Default on Search; addable elsewhere | Shows level/rank, or Link Rating when linkval present. |
| ATK | atk | Card | Search, Lists, Collection | Default on Search; addable elsewhere | Nullable (?). |
| DEF | def | Card | Search, Lists, Collection | Default on Search; addable elsewhere | Blank for Link monsters. |
| Ban / points | FormatEngine (banlist + genesys_points) | Card × format | Search, Lists, Collection | Default on Search when format active; addable elsewhere | Not raw banlist_info; derived for the active format. |
| Condition | user.condition | User item | Lists, Collection | Default on Lists & Collection | NM / LP / MP / HP / DMG. |
| Typeline | typeline[] | Card | Search, Lists, Collection | Addable | Joined race/frame tags (e.g. Spellcaster / Normal). |
| Card type (readable) | humanReadableCardType | Card | Search, Lists, Collection | Addable | Longer type label from API. |
| Frame | frameType | Card | Search, Lists, Collection | Addable | normal, effect, synchro, xyz, link, spell, trap, skill, … |
| Race / typing | race | Card | Search, Lists, Collection | Addable | Monster race or Spell/Trap/Skill subtype. |
| Archetype | archetype | Card | Search, Lists, Collection | Addable | May be absent. |
| Link markers | linkmarkers[] | Card | Search, Lists, Collection | Addable | Render with the Link marker icon (UI); blank if not Link. |
| Scale | scale | Card | Search, Lists, Collection | Addable | Pendulum scale; blank if not Pendulum. |
| Passcode | id | Card | Search, Lists, Collection | Addable | Eight-digit passcode (API id). |
| YGOPRODeck | ygoprodeck_url | Card | Search, Lists, Collection | Addable | Link column to upstream card page. |
| TCG date | misc_info[].tcg_date | Card | Search, Lists, Collection | Addable | Requires misc=yes ingest. |
| OCG date | misc_info[].ocg_date | Card | Search, Lists, Collection | Addable | Requires misc=yes ingest. |
| Konami ID | misc_info[].konami_id | Card | Search, Lists, Collection | Addable | Requires misc=yes ingest. |
| Has effect | misc_info[].has_effect | Card | Search, Lists, Collection | Addable | 0/1 from misc_info. |
| Master Duel rarity | misc_info[].md_rarity | Card | Search, Lists, Collection | Addable | MD rarity string. |
| Treated as | misc_info[].treated_as | Card | Search, Lists, Collection | Addable | Name treated-as; when present. |
| Staple | misc_info[].staple | Card | Search, Lists, Collection | Addable | e.g. Yes; when present. |
| Views | misc_info[].views | Card | Search, Lists, Collection | Addable | All-time YGOPRODeck views. |
| Views (week) | misc_info[].viewsweek | Card | Search, Lists, Collection | Addable | Weekly views. |
| Upvotes | misc_info[].upvotes | Card | Search, Lists, Collection | Addable |  |
| Downvotes | misc_info[].downvotes | Card | Search, Lists, Collection | Addable |  |
| Formats (API) | misc_info[].formats[] | Card | Search, Lists, Collection | Addable | Upstream format tags (not OTCP curated formats). |
| Beta ID | misc_info[].beta_id | Card | Search, Lists, Collection | Addable | When present. |
| Beta name | misc_info[].beta_name | Card | Search, Lists, Collection | Addable | When present. |
| Set name | card_sets[].set_name | Printing | Lists, Collection | Addable | Full set name for selected printing. |
| Set rarity code | card_sets[].set_rarity_code | Printing | Lists, Collection | Addable | e.g. (UR); may be empty. |
| Set price | card_sets[].set_price | Printing | Lists, Collection | Addable | Upstream set price; treat 0 / 0.00 / empty as blank (unknown), never \$0.00. |
| Cardmarket | card_prices[].cardmarket_price | Card | Search, Lists, Collection | Addable | Published snapshot. |
| eBay | card_prices[].ebay_price | Card | Search, Lists, Collection | Addable | Published snapshot. |
| Amazon | card_prices[].amazon_price | Card | Search, Lists, Collection | Addable | Published snapshot. |
| CoolStuffInc | card_prices[].coolstuffinc_price | Card | Search, Lists, Collection | Addable | Published snapshot. |
| My value | user.my_value | User item | Lists, Collection | Addable (Must) | USD override for Current / P/L. |
| Note | user.note | User item | Lists, Collection | Addable | Free text. |
| Acquired | user.acquired | User item | Lists | Addable | Check-off flag. |
| EU print | user.variant_eu | User item | Lists, Collection | Addable | Variant flag. |
| 1st Edition | user.variant_1st | User item | Lists, Collection | Addable | Variant flag. |
| Faded / misprint | user.variant_faded | User item | Lists, Collection | Addable | Variant flag. |
| (hidden) Card images | card_images[].image_url* | Card | — | Hidden — not a column | Art is a thumbnail / detail pane via re-hosted assets; raw upstream URLs are not columns. |
| (hidden) Image id | card_images[].id | Card | — | Hidden — not a column | Duplicates passcode; internal. |
| (hidden) Card text | desc / pend_desc / monster_desc | Card | — | Hidden — detail only | Too long for a table cell; shown on card detail. |
| (hidden) Raw banlist_info | banlist_info | Card | — | Hidden — not a column | Use Ban / points from FormatEngine for the active format instead. |

### Formats reference

| Id | Name | Definition (summary) | Priority |
|---|---|---|---|
| advanced | Advanced | Current TCG Forbidden & Limited List; full TCG pool. Source: yugioh-card.com/en/limited/. | Must |
| traditional | Traditional | Same list as Advanced; Forbidden treated as Limited. Source: Konami deck construction rules. | Must |
| speed-duel | Speed Duel | Speed Duel logo pool; Skill cards; Main 20–30, Extra 0–6, Side 0–6. YGOPRODeck `format=Speed Duel`, `type=Skill Card`. | Must |
| genesys | Genesys | No Link/Pendulum; points from YGOPRODeck `genesys_points` with Konami spot-check; default cap 100, user-settable. Official rules: yugioh-card.com/en/genesys/. | Must |
| goat | GOAT | April 2005 TCG list; pool per goatformat.com/cardpool.html (curated snapshot). | Must |
| edison | Edison | March 2010 TCG list; pool through Duelist Pack: Kaiba (edisonformat.net). | Must |
| hat | HAT | April 2014 TCG list; pool per hatformat.com (curated snapshot). | Must |
| tengu | Tengu Plant | September 2011 TCG list; pool per tenguformat.com (curated snapshot). | Must |
| teledad | TeleDAD | September 2008-era (curated when added). | Could |

Format Library (formatlibrary.com/formats/) informed naming and UX only. Data is hand-curated (OD-01); do not scrape Format Library. Could formats such as TeleDAD are deferred.

### Deck rules reference

| Rule | Value |
|---|---|
| Advanced / Traditional / Goat / Edison / HAT / Tengu — Main | 40 to 60 cards |
| Advanced / Traditional / Goat / Edison / HAT / Tengu — Extra | 0 to 15 cards |
| Advanced / Traditional / Goat / Edison / HAT / Tengu — Side | 0 to 15 cards |
| Speed Duel — Main | 20 to 30 cards |
| Speed Duel — Extra | 0 to 6 cards |
| Speed Duel — Side | 0 to 6 cards |
| Speed Duel — Skill | At most one active Skill; not counted toward Main size in the builder; YDK puts the Skill id under `#main` (YGOPRODeck). Extra Skills may sit in Side between Duels |
| Genesys — Extra rules | No Link or Pendulum; Main/Extra/Side sizes as Advanced; combined points ≤ active cap (default 100, user-settable) |
| Copies per card | At most 3, further limited by the active banlist (Traditional: Forbidden → Limited) |
| Section placement | Fusion/Synchro/Xyz/Link (and like) belong in Extra; others in Main unless format says otherwise |

### Deck export formats reference

| Format | Channel | Shape |
|---|---|---|
| YDK file | Download / import | `.ydk` with `#main`, `#extra`, `!side`; one id per line. Speed Duel: Skill card id is included under `#main` (YGOPRODeck layout). Import is UTF-8 with size and line limits; unknown ids are refused. |
| YDKE | Clipboard | `ydke://` Base64 Main!Extra!Side! URL used by EDOPro and others |
| TCGplayer Mass Entry | Clipboard | One line per card: `Qty Name` optionally `Name [SET] number` |
| Plaintext list | Clipboard | Sections Main/Extra/Side with `Qtyx Name` lines |

### Auth methods reference

| Method | Priority | Notes |
|---|---|---|
| Email and password | Must | Supabase Auth (OD-02, OD-06) |
| Google OAuth | Must | Supabase Auth (OD-02, OD-06) |

Auth methods follow OD-06 (Decided 2026-10-27).

### Sharing reference

| Rule | Value |
|---|---|
| Link form | HTTPS URL containing an opaque high-entropy share secret (no sequential integers); server stores only a hash; target is a deck or a want list |
| Access | Anyone with the link sees a read-only deck or want list; editing requires ownership |
| Revocation | Owner can revoke; old URL stops resolving (Must) |
| Lifetime | No calendar expiry; lasts until revoke or parent deck/want-list/account delete |
| Auth for viewers | Not required |

### Price sources reference

| Vendor | Price field | Link behavior | Priority |
|---|---|---|---|
| TCGplayer | YGOPRODeck `tcgplayer_price` (USD, lowest across printings) | Fixed https search URL template for the card name | Must |
| CoolStuffInc | YGOPRODeck `coolstuffinc_price` (USD) | Fixed https search URL template for the card name | Must |
| Cardmarket | YGOPRODeck `cardmarket_price` (EUR) | Fixed https search URL template for the card name | Must |

Freshness follows OD-03 (weekly and manual with card data). Missing upstream values show as Unavailable, not \$0.

### Screen map reference

| Screen | Purpose |
|---|---|
| Home / Search | Search field; faceted filter chrome; customizable Table default on desktop ≥~640 (List/Grid toggles); compact icon rows (List) on phone — no Table |
| Results / Table | Default desktop view on Search, Lists, and Collection: customizable sortable Table; under ~640 px Table hidden — compact icon rows only |
| Filters (phone) | Full-screen filter sheet from a Filters button (active count); Apply / See N results; hamburger remains for app nav |
| Card detail | Phone: stacked art then details with one page gutter; desktop: art left, compact detail column (~560–640 px); prices, legality, add-to-deck / collection / Lists |
| Formats | Format list; format detail banlist grouped Forbidden / Limited / Semi-Limited in List or Grid |
| Deck editor | Deck editor (opened from Decks): Main/Extra/Side (or Skill); CardFinder split on desktop / Add-cards sheet on phone; List default on phone; Grid image sections on desktop; counts and Genesys points; owned/missing vs collection. No separate Builder primary-nav destination. |
| List editor | Want-list editor with CardFinder; qty/set/note; check-off; shared editor row style with deck/collection |
| Collection editor | Owned printings editor with CardFinder; shared editor row style with deck/list |
| Lists | Named want lists; qty, set/rarity, note, purchase + market price, condition/variants; value summary; customizable Table default on desktop; compact icon rows on phone; share; export |
| Collection | Owned printings with qty, set, rarity, purchase + market price, condition/variants; value summary; customizable Table default on desktop; compact icon rows on phone; add from search/detail/deck |
| Account | Sign in, sign up, theme, card-view preference, saved decks/wants/collection, delete account |
| Shared deck / List | Read-only view of a shared deck or List |
| About / Notices | Version, licenses, data source credits |

## Appendix: Interface sketch

Approved UI direction and screens: docs/UI.md (Version 1.0, Approved 2026-10-28) and docs/images/ui/. Chrome direction: Ink. App icon: Stack shape, V1 Mono charcoal. Default theme: Match system. Phone nav: hamburger drawer — Search, Formats, Decks, Collection, Lists, Account (no separate Builder; deck editor is reached from Decks). Desktop top nav matches. List/Grid toggle on card views (Grid default for search and deck on desktop); Table is a desktop third option on search, Lists, and collection (≥~640 CSS px). List ban markers inline after ATK/DEF; Grid ban overlays top-left of card art. Phone: Search/Lists/Collection use compact icon rows (no Table); grids at least 3 columns at 360–430 CSS px when Grid is chosen. Want lists and basic collection in v1. CardFinder in deck/list/collection editors. Faceted filters: desktop left sidebar; phone full-screen sheet.
