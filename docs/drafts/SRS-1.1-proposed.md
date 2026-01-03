# Proposed SRS edits for version 1.1

Prepared by Filliciano Plong. These are drafts only. `docs/SRS.md` and `docs/ARCHITECTURE.md` stay at version 1.0 until I apply them. The architecture half is `docs/drafts/ARCHITECTURE-1.1-proposed.md`.

Each edit below gives the section, the current text, the proposed text, and the spike it comes from. The spike notes in `spikes/s01`, `spikes/s03`, `spikes/s04`, and `spikes/s05` are the source. Where this draft and a note differ, the note wins.

S-02 (Supabase free tier) has not run, so the Supabase lines stay UNVERIFIED and are not in this draft.

## Checklist

| Spike | Result | Where it ran | Where the edits are |
|---|---|---|---|
| S-01 | Pass on emulation. The reference phone run is still open. | Chromium with the Playwright Pixel 5 descriptor, CPU throttle 4× and 6×, January 3, 2026 | SRS 7.1 (NFR-01) below. Architecture 6.1, 6.2, R-01, 9.2. |
| S-03 | Pass. One open gap (Elemental HERO Grand Neos, G-02). | Node 22.23.4, YGOPRODeck API v7, January 1, 2026 | SRS 6.18 and the Formats reference below. Architecture R-03, 6.9, 9.2. |
| S-04 | Pass. No non-permissive license. | Node 22.23.4, npm 10.9.9, December 27, 2025 | SRS 10.3 below. Architecture 9, 9.2, R-04. |
| S-05 | Pass. Skill ids sit under `#main`. | Python 3.12.3 HTTPS reads, EDOPro source read only, December 30, 2025 | SRS 6.6, 6.8, and the Deck rules and Deck export formats references below. Architecture ADR-010, 9.2. |

## On approval

Add this row to the revision history, and set the title date and version to 1.1. Do not add it with this draft.

| Version | Date | Changes |
|---|---|---|
| 1.1 | The day these edits are applied | Recorded spikes S-01, S-03, S-04, and S-05. Closed the UNVERIFIED lines those spikes settled. |

## S-01. Search and facet recount latency

### SRS 7.1 Performance, the NFR-01 UNVERIFIED line

**Spike:** S-01

**Section:** 7.1 Performance

**Current text:**

> **UNVERIFIED:** Whether 100 ms after keystroke (name search and filter + facet-count refresh) is achievable for the full Yu-Gi-Oh! card index on the reference phone depends on index size and bitset facet implementation. Check with spike S-01 in the architecture.

**Proposed text:**

> **UNVERIFIED:** S-01 (January 3, 2026) measured the full card set (14,645 cards) in Chromium with a Pixel 5 viewport and CPU throttling at 4× and 6×. The slowest keystroke was 15.8 ms and the slowest facet change was 7.3 ms, both under 100 ms. The run is an emulation, not the reference phone, so NFR-01 stays a target until a handset timing is recorded.

NFR-01 itself is unchanged.

## S-03. Goat, HAT, and Tengu banlists

### SRS 6.18, the snapshot UNVERIFIED line

**Spike:** S-03

**Section:** 6.18 (the UNVERIFIED line at the end of section 6)

**Current text:**

> **UNVERIFIED:** Curated banlist snapshots for Goat, HAT, and Tengu are not yet written into the repo. Check each Must historical format against its primary source before release.

**Proposed text:**

> S-03 saved Goat, HAT, and Tengu banlist snapshots under spikes/s03/. Goat (73) matches YGOPRODeck ban_goat. HAT (162) matches the archived April 1, 2014 Konami list. Tengu (134) matches the archived September 1, 2011 Konami list. Morphing Jar #2 on the Tengu community page was left out. Copy the chosen rows into the format files before release.

### Formats reference, the goat, hat, and tengu rows

**Spike:** S-03

**Section:** Formats reference

**Current text:**

> | goat | GOAT | April 2005 TCG list; pool per goatformat.com/cardpool.html (curated snapshot). | Must |
>
> | hat | HAT | April 2014 TCG list; pool per hatformat.com (curated snapshot). | Must |
>
> | tengu | Tengu Plant | September 2011 TCG list; pool per tenguformat.com (curated snapshot). | Must |

**Proposed change:** Add the card-pool cutoff from each snapshot's `cardPool` to its row, and point the status check at spikes/s03/. Leave the list names as April 2005, April 2014, and September 2011.

## S-04. npm licenses

### SRS 10.3 Software and APIs, the license cells

**Spike:** S-04

**Section:** 10.3 Software and APIs

**Current text:**

> | Vite, React, TypeScript, Tailwind | Client shell (OD-04) | MIT (typical; verify each package) | PR #1; OD-04 |
>
> | Vitest, Playwright | Unit and end-to-end tests (OD-04) | MIT (typical; verify) | PR #1; OD-04 |
>
> | Supabase | Auth and deck storage (OD-02) | Vendor terms | OD-02 |

**Proposed text for the License cells:**

> Vite, React, and Tailwind: MIT. TypeScript: Apache-2.0. Confirmed in S-04.
>
> Vitest: MIT. Playwright (`@playwright/test`): Apache-2.0. Confirmed in S-04.
>
> Hosted service: vendor terms. Client `@supabase/supabase-js`: MIT (S-04, 2.118.0). Runtime dependency `tslib` is 0BSD.

### SRS 10.3, the UNVERIFIED paragraph

**Spike:** S-04

**Section:** 10.3 Software and APIs

**Current text:**

> **UNVERIFIED:** Exact third-party package licenses for the PR #1 stack are not re-checked in this draft. Verify each npm license before release. TCGplayer new API access remains closed as of December 27, 2025.

**Proposed text:**

> **UNVERIFIED:** TCGplayer new API access remains closed as of December 27, 2025. S-04 checked npm licenses for the main shell lockfile, the scaffold-draft lockfile, and `@supabase/supabase-js` 2.118.0. None were GPL, AGPL, LGPL, SSPL, unknown, or unlicensed. The Notices page lists the runtime packages from that inventory (NFR-18).

## S-05. Speed Duel Skill ids in YDK

### SRS 6.6 and 6.8, FR-17, FR-28, and FR-31

**Spike:** S-05

**Section:** 6.6 Formats and banlists (FR-17), 6.8 Deck export (FR-28, FR-31)

**Current text (FR-31):**

> The system shall import a `.ydk` file in YGOPRODeck's layout, mapping a Skill card id in `#main` to the Speed Duel Skill slot, and refuse oversize, non-UTF-8, or unknown-id files with a clear reason.

**Proposed change:** Keep export under `#main`. Extend import so a Skill id found only under `!side` still fills the Skill slot, and a file with no Skill id stays Skill-empty. Add the `!side` fallback sentence to the export requirement (FR-28): if a consumer rejects a Skill id in `#main`, write it under `!side`. FR-17 is unchanged.

### Deck rules reference, the Speed Duel Skill row

**Spike:** S-05

**Section:** Deck rules reference

**Current text:**

> At most one active Skill; not counted toward Main size in the builder; YDK puts the Skill id under `#main` (YGOPRODeck). Extra Skills may sit in Side between Duels

**Proposed text:**

> At most one active Skill. It does not count toward Main size. Export puts that id under `#main`. Import also accepts the id under `!side`, and accepts no Skill.

### Deck export formats reference, the YDK row

**Spike:** S-05

**Section:** Deck export formats reference

**Current text:**

> `.ydk` with `#main`, `#extra`, `!side`; one id per line. Speed Duel: Skill card id is included under `#main` (YGOPRODeck layout). Import is UTF-8 with size and line limits; unknown ids are refused.

**Proposed text:**

> `.ydk` with `#main`, `#extra`, and `!side`, one id per line, markers without a trailing space. The Speed Duel Skill id is under `#main` on export. Import maps a Skill id in `#main` or, when that is the only Skill id, in `!side`, to the Skill slot. Import is UTF-8 with size and line limits; unknown ids are refused.
