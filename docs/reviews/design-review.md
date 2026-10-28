# Design review: OTCP

Prepared for: Filliciano Plong · Date: October 27, 2026 · Status: private (docs/reviews/). Status: all findings applied 2026-10-27

| Item | Detail |
|---|---|
| Scope | Architecture §4 components; §5 views; §6 contracts (search, deck, share, pipeline, security baseline, schema sketch); ADR-001–011; risks; spikes; §10 traceability. Focus: module interfaces, data pipeline contract, Supabase/repository layer, export/import. |
| Inputs | ARCHITECTURE.md v1.0 Approved; SRS.md v1.0 Approved; pending_edits.md |
| Method | design-review skill: responsibilities, preconditions, data contracts, failure paths, compatibility. Every failure path needs an outcome the caller can handle. |
| Evidence | Document review only. No application code is reviewed here, so nothing is a reproduced runtime failure. |
| Gate | Findings that would change approved docs go into pending_edits.md as PROPOSED. Approved docs are not edited in this pass. |

## Findings

| ID | Severity | Evidence | Finding | Recommendation |
|---|---|---|---|---|
| DR-01 | High | ARCH §6.2 Deck contract; §4 DeckStore; ADR-006 | DeckStore has no typed repository contract for save, list, load, rename, delete: no success/error shapes, no conflict or network outcomes, and no statement that Supabase is reached only through this module. | Add §6.x `DeckStore` API: inputs, `{ok}` / `{error, code, message, retryable}` / `{unauthorized}`, and a one-line rule that UI never calls Supabase tables directly. |
| DR-02 | High | ARCH §6.3 Share contract; §6.5 “raw token shown once”; ADR-007 | Share create/open/revoke outcomes are prose only. Create does not define the returned URL shape; open does not define not-found vs revoked vs deleted-deck; revoke has no failure path. | Add §6.x ShareService outcomes: create → `{ok, url}` once; open → `{ok, deck}` \| `{notFound}`; revoke → `{ok}` \| `{notFound}` \| `{unauthorized}`. |
| DR-03 | High | ARCH §6.5; ADR-011; QS-06; FR-35 | Account deletion spans AuthClient, DeckStore, and ShareService, but there is no ordered delete contract (auth user vs decks vs share rows) or failure if only some rows delete. | Add a delete-account sequence contract: server-side (or Edge Function) hard-deletes auth user, decks, and shares in one owner-scoped operation; client shows confirmed / failed with retry guidance. |
| DR-04 | Medium | ARCH §6.4 step 8; QS-03; NFR-08 | “Replace published JSON/images” on success is not atomic on GitHub Pages: partial upload could leave mixed old/new assets. | Specify publish as a single new artifact directory (or release tag) swapped by updating one pointer (for example `latest` redirect or one manifest URL); never overwrite files in place mid-job. |
| DR-05 | Medium | ARCH ExportCodec; ADR-010; FR-28–FR-31; AC-06 | Export/import have no failure outcomes: oversized file, unknown card ids, missing markers, non-UTF-8, or Skill not in catalog. | Document ExportCodec results: `{ok, blob\|text}` \| `{refused, reason, message}` for import; size and line limits; unknown ids refused with count. |
| DR-06 | Medium | ARCH §6.6 Deck `main/extra/side`; Fig. 5 | Multiplicity is “repeated ids or count pairs” — two wire shapes. Callers and tests cannot agree. | Pick one v1 encoding (recommend repeated ids to match YDK) and note count-pairs as a future schema version if needed. |
| DR-07 | Medium | ARCH QS-04; Fig. 8; FR-27 | Guest draft “offered for import once” has no contract when a cloud deck already exists, when the user declines, or when two browser profiles hold drafts. | Define guest-import prompt rules: once per browser profile after first sign-in; decline dismisses permanently for that draft id; never overwrite a saved deck without explicit replace. |
| DR-08 | Medium | ARCH §10; FR-05, FR-07, FR-08, FR-11 | Several Must/Should FRs map to component “-” (filters/history-ish rows). Ownership is unclear for implementation planning. | Assign each “-” FR to CardCatalog, AppShell, or FormatEngine in §10 (or mark package-wide intentionally). |
| DR-09 | Low | ARCH §6.1 Search contract | Permanent index-load failure vs “not ready” is only a loading state; no degraded search or hard error. | Add failure: `{indexUnavailable, message}` after load timeout; search field disabled until retry succeeds. |
| DR-10 | Low | ARCH §5.4 vs §5.8; ADR-006 | Sequence Fig. 4 assumes signed-in; guest localStorage path is only a limitation note, not a companion sequence. | Add a short guest-draft sequence (or extend Fig. 8) so storage ownership is testable before M1. |

## Clean areas

- Component names in §4 match the stated diagram convention; ADR-001/007/009/011 already aligned with SRS OD decisions.
- Search happy-path contract (§6.1) matches QS-01 / NFR-01 timing intent.
- Pipeline fail-closed validation (steps 7–8, QS-03) matches NFR-08.
- Share opacity and no calendar TTL match ADR-007 and OD-07.
- Immediate hard-delete intent matches OD-10 / NFR-07 / ADR-011 (ordering still open — DR-03).

## Boundary test

**Case:** Review with §6.3 Share contract removed from a copy of ARCHITECTURE.md.

**Expected:** DR-02 loses its primary location and should be restated as “share API missing entirely”; DR-01/DR-03 remain via DeckStore and delete paths; R-08 still flags token entropy from §8.

**Result:** Matched on a stripped working copy. No findings invented beyond missing interface.

## Severity counts

| High | Medium | Low |
|---|---|---|
| 3 | 5 | 2 |
