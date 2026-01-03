# Proposed architecture edits for version 1.1

Prepared by Filliciano Plong. These are drafts only. `docs/ARCHITECTURE.md` and `docs/SRS.md` stay at version 1.0 until I apply them. The SRS half is `docs/drafts/SRS-1.1-proposed.md`, and its checklist covers the spikes, builds, and dates.

Each edit below gives the section, the current text, the proposed text, and the spike it comes from. The spike notes in `spikes/s01`, `spikes/s03`, `spikes/s04`, and `spikes/s05` are the source. Where this draft and a note differ, the note wins.

S-02 (Supabase free tier) has not run. The S-02 lines in 9.1 and 9.2, ADR-006, and the Supabase row in section 9 stay as they are.

## On approval

Add this row to the revision history, and set the title date and version to 1.1. Do not add it with this draft.

| Version | Date | Changes |
|---|---|---|
| 1.1 | The day these edits are applied | Recorded spikes S-01, S-03, S-04, and S-05. Closed the UNVERIFIED lines those spikes settled. Based on SRS 1.1. |

## S-01. Search and facet recount latency

### 6.1 Search contract and 6.2 Filter contract, the UNVERIFIED lines

**Spike:** S-01

**Section:** 6.1 Search contract, 6.2 Filter contract

**Current text:**

> **UNVERIFIED:** Search latency on the reference phone is UNVERIFIED until spike S-01.
>
> **UNVERIFIED:** Facet-count refresh under 100 ms is UNVERIFIED until S-01; lazy off-screen groups are allowed per ADR-012.

**Proposed text (replaces both lines):**

> S-01 (2026-01-03) built the ADR-009 index (name trigrams, passcode prefix, rules-text tokens, facet bitsets) from the full YGOPRODeck cardinfo feed (`misc=yes`, 14,645 cards). In Chromium, with a Pixel 5 viewport and CPU throttling at 4× and 6×, the slowest keystroke was 15.8 ms and the slowest facet change was 7.3 ms, including a full recount of type, attribute, race, level, ATK, DEF, archetype, and TCG ban status. That is under the 100 ms budget. The run is an emulation, not the reference phone, so NFR-01 stays a target until a handset timing is recorded. ADR-009 and ADR-012 fallbacks were not required for the emulated budget. Index build was about 1.3 s (p50) at 6× and stays outside the 100 ms clock.

The 6.2 Budget row keeps its wording.

### 8 Risks, R-01

**Spike:** S-01

**Section:** 8 Risks

**Current text:**

> | R-01 | Client search or facet-count refresh misses the 100 ms target on the reference phone | Medium | High | Spike S-01; Worker or trimmed fields; lazy off-screen facet groups per ADR-012 | Developer |

**Proposed change:** Keep the risk open until the handset run. Add to the mitigation that the emulation did not miss 100 ms, and that a handset miss still uses the ADR-009 fallbacks (worker, precomputed index, lazy off-screen groups), not a different view library (ADR-001).

### 9.2 UNVERIFIED list, the search bullet

**Spike:** S-01

**Current text:**

> - Client search and on-screen facet-count refresh under 100 ms on the reference phone (ADR-009, ADR-012, S-01).

**Proposed text:**

> - Client search and on-screen facet-count refresh under 100 ms on the reference phone (ADR-009, ADR-012). S-01 passed on emulation; the handset timing is still open.

## S-03. Goat, HAT, and Tengu banlists

### 8 Risks, R-03

**Spike:** S-03

**Current text:**

> | R-03 | Goat / HAT / Tengu banlist snapshots are incomplete or disputed | Medium | Medium | Spike S-03; cite sources in format files; mark uncertain rows | Developer |

**Proposed addition to the mitigation:**

> S-03 wrote the three snapshots and a gap list. Morphing Jar #2 is resolved and is not in the Tengu snapshot. The open part of this risk is the remaining gap rows, including the HAT pool end date, not a missing file.

### 9.2 UNVERIFIED list, the Goat / HAT / Tengu bullet

**Spike:** S-03

**Current text:**

> - Goat / HAT / Tengu banlist completeness (ADR-004, S-03).

**Proposed text:**

> - S-03 recorded the snapshots. Goat matches ban_goat. HAT and Tengu statuses are not in YGOPRODeck banlist_info. Tengu matches the September 1, 2011 list. Open gaps remain in spikes/s03/gaps.json.

### 6.9 Schema sketch, the banlist snapshot row

**Spike:** S-03

**Current text:**

> | banlist snapshot | formatId, effective date, card id → status enum; unknown fields refused |

**Proposed change:** Use the keys from open question 4 of the S-03 note: `formatId`, `effectiveDate`, `source`, `cardPool`, and `cards[]` of `id`, `passcode`, `name`, `status`, `note`. Status is `forbidden`, `limited`, or `semi-limited`. Unknown keys stay refused once that set is approved.

## S-04. npm licenses

### 9 Technology stack, the License column

**Spike:** S-04

**Section:** 9 Technology stack

**Proposed license cells:**

| Row | Proposed license cell |
|---|---|
| Vite | MIT (confirmed S-04: scaffold-draft `vite@7.3.7`; main's Vitest peer installs `vite@8.3.5`, also MIT) |
| React | MIT (confirmed S-04: `react@19.3.1` and `react-dom@19.3.1` on scaffold-draft) |
| TypeScript | Apache-2.0 (confirmed S-04: `typescript@5.9.3`) |
| Tailwind CSS | MIT (confirmed S-04: `tailwindcss@4.3.3` on scaffold-draft) |
| Vitest | MIT (confirmed S-04: `vitest@5.0.5`) |
| Playwright Chromium-only | Apache-2.0 (confirmed S-04: `@playwright/test@1.64.1`) |
| Supabase | MIT for `@supabase/supabase-js@2.118.0` and its `@supabase/*` and `iceberg-js` runtime dependencies. `tslib@2.8.1` is 0BSD. Confirmed S-04. Hosted-service terms are unchanged. |
| React Router | MIT (confirmed S-04: `react-router@7.18.5` on scaffold-draft) |

**Current text under the table:**

> **UNVERIFIED:** Versions and licenses marked UNVERIFIED. Confirm after the spikes below.

**Proposed text:**

> **UNVERIFIED:** Versions marked UNVERIFIED. Confirm after the spikes below. Licenses in this table were confirmed in S-04 for the versions named above.

### 9.2 UNVERIFIED list, the license bullet

**Spike:** S-04

**Proposed change:** Remove this bullet.

> - npm dependency licenses for the Notices page (NFR-18, S-04).

### 8 Risks, R-04 mitigation

**Spike:** S-04

**Current text:**

> Spike S-04 license scan in CI; replace the package

**Proposed text:**

> S-04 found no non-permissive license. CI runs `npm run licenses` and fails if a package is outside the allowlist. Replace the package if a scan fails.

## S-05. Speed Duel Skill ids in YDK

### ADR-010, the Decision row

**Spike:** S-05

**Current text:**

> ExportCodec modules encode/decode under Node-testable functions with documented success and refused outcomes. YDK places the Speed Duel Skill card id under #main, matching YGOPRODeck's downloadYDK behavior. Also support YDKE, TCGplayer Mass Entry, and plain text. Import accepts UTF-8 YDK under size and line caps, refuses unknown ids, and uses the same Skill rule.

**Proposed text:**

> Export writes the active Speed Duel Skill id under `#main`, one id per line, using the card's YGOPRODeck `id`. Markers are `#main`, `#extra`, and `!side`, each alone on its line. YDKE uses those same three segments and has no Skill segment. Import accepts a Skill id under `#main` or under `!side`, and accepts a deck with no Skill id. A Skill id under `#main` does not count toward Main size. If the only Skill id is under `!side`, it is the active Skill. Fallback: if a consumer rejects a Skill id in `#main`, write it under `!side`. Also support TCGplayer Mass Entry and plain text. Import is UTF-8 under size and line caps and refuses unknown ids.

### 9.2 UNVERIFIED list, the Skill bullet

**Spike:** S-05

**Current text:**

> - Skill-card placement across a large Speed Duel YDK corpus (ADR-010, S-05).

**Proposed text:**

> - Skill ids under `#extra` (ADR-010). S-05 settled `#main` and `!side`; `#extra` was not observed.
