# Data model review: OTCP

Prepared for: Filliciano Plong · Date: October 27, 2026 · Status: private (docs/reviews/). Status: all findings applied 2026-10-27

| Item | Detail |
|---|---|
| Scope | ARCH §6.6 schema sketch (core, Yu-Gi-Oh! card, deck); curated formats/banlists/overrides (ADR-004); Supabase persistence for decks, shares, profiles; RLS; retention (OD-10, NFR-06/07). |
| Inputs | ARCHITECTURE.md v1.0 Approved; SRS.md v1.0 Approved (esp. §5.1, §9, OD-10); pending_edits.md |
| Method | data-model-review skill: identities, cardinality, ownership, invariants, versioning, sensitive fields, retention. |
| Evidence | Document review only. Example rows below are synthetic. |
| Gate | Model gaps that need SRS or architecture text go to pending_edits.md as PROPOSED. Approved docs are not edited here. |

## Annotated model (as documented today)

```
Published dataset (static Pages)
  schemaVersion, game, generatedAt
  cards[]  -- Yu-Gi-Oh! extension fields
  formats[] -- curated descriptors + banlist refs

Curated repo files (owner-edited)
  formats/*.json, banlists/*.json, overrides.json

Browser (guest)
  draft deck document (ownerId null)

Supabase (signed-in) -- tables not named in ARCH
  ? profiles
  ? decks
  ? share_links / share_tokens
```

## Findings

| ID | Severity | Evidence | Finding | Recommendation |
|---|---|---|---|---|
| DM-01 | High | ARCH §6.6; ADR-006; NFR-04 | Supabase tables are implied (“extra table”, “Postgres for saved decks”) but not named. No column list for `decks`, `share_links`, or `profiles`. | Add an architecture subsection: table names, primary keys, foreign keys, and which columns the client may read/write. |
| DM-02 | High | ARCH §6.5 “RLS ties decks to auth.uid()”; ADR-006 | RLS is named but no policy rules are written (SELECT/INSERT/UPDATE/DELETE per table; share open path for anon). | Document RLS policies: owner-only CRUD on decks; share insert/revoke by owner; anon SELECT of deck payload only via valid token RPC or security-definer view — never open table SELECT. |
| DM-03 | High | ARCH §6.5 “hashed or as lookup keys” | Token storage is ambiguous. Hashing vs storing the raw lookup key changes revoke and leak behavior. | Decide: store only a hash of the token (recommend SHA-256 of high-entropy secret) and look up by hash; never persist the raw token after create response. |
| DM-04 | Medium | ARCH §6.6 Deck fields; DR-06 overlap | `main/extra/side` allow two multiplicity encodings; `skillId` null vs omitted vs 0 unclear; `genesysCap` null vs default 100. | Fix wire rules: repeated ids; `skillId` omitted when unused; `genesysCap` default 100 when format is Genesys and omitted otherwise. |
| DM-05 | Medium | ADR-004; FR-48; S-03 | formats / banlist / overrides file schemas are prose only: no required keys, version field, or unknown-field rule. | Specify JSON schemas (or TypeScript types checked in CI) for format descriptor, banlist snapshot, and overrides; unknown fields refused at pipeline validate. |
| DM-06 | Medium | ARCH §6.6 `ban` object; FR-14 | Ban status shape (“per-format status refs”) is not a concrete map (`formatId → Unlimited\|Limited\|Semi\|Forbidden`). | Define `ban: Record<formatId, statusEnum>` (or parallel array) with closed enum matching SRS language. |
| DM-07 | Medium | QS-06; ADR-011; FR-35 | Cascade from account delete to decks and shares is behavioral, not a data rule (ON DELETE CASCADE vs app delete). | State FK `share_links.deck_id → decks.id ON DELETE CASCADE` and account delete removes all owner decks (cascade shares). |
| DM-08 | Medium | SRS Account retention; guest FR-27 | Guest draft retention in browser storage is unspecified (until clear site data? quota?). | Note: guest drafts live until the user clears site data, imports after sign-in, or the app overwrites the single draft slot; not covered by OD-10. |
| DM-09 | Low | ARCH §6.6 `id` number; FR-03 | Passcode vs YGOPRODeck id collision / missing passcode cards not addressed. | Rule: primary key is YGOPRODeck `id`; display passcode when present; search accepts either when both exist. |
| DM-10 | Low | ARCH core `schemaVersion`; deck document | Deck documents have no `schemaVersion` / `deckFormatVersion` for future migrations of saved rows. | Add `deckSchemaVersion` integer on saved decks; pipeline `schemaVersion` stays on the published dataset only. |

## Rules register (target)

| Rule | Where enforced | How verified |
|---|---|---|
| Deck row `owner_id = auth.uid()` | Supabase RLS | Negative test: other user’s JWT cannot SELECT/UPDATE |
| Share open without login | Token RPC / security definer | AC-08 private window |
| Live personal data gone on delete | Delete contract + CASCADE | AC-07 / QS-06 |
| Published JSON validates | DataPipeline step 7 | QS-03 fixture |
| Overrides cannot invent unknown card ids | Pipeline referential check | CI unit test |
| Guest draft never written to Supabase | DeckStore | Test signed-out save blocked |

## Boundary test

**Case:** Review with §6.6 schema sketch removed.

**Expected:** DM-01–DM-04 and DM-09–DM-10 strengthen to “no persisted model at all”; curated-file findings (DM-05) and RLS (DM-02) remain via ADR-004/006.

**Result:** Matched on a stripped working copy.

## Severity counts

| High | Medium | Low |
|---|---|---|
| 3 | 5 | 2 |
