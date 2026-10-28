# Security design review: OTCP

Prepared for: Filliciano Plong · Date: October 27, 2026 · Status: private (docs/reviews/). Status: all findings applied 2026-10-27

| Item | Detail |
|---|---|
| Scope | Trust boundaries in ARCH Fig. 6 / §6.4–6.5: build-time YGOPRODeck and Konami fetch; re-hosted images; Supabase auth/OAuth on Pages `/otcp/`; RLS; share tokens; YDK/YDKE import; store deep links; GitHub Actions secrets; account deletion. |
| Inputs | ARCHITECTURE.md v1.0 Approved; SRS.md v1.0 Approved (NFR-03–07, FR-35, FR-41–43, FR-54); risks R-06–R-08 |
| Method | security-design-review skill (STRIDE as a prompt). Design review only — not a penetration test or security guarantee. |
| Evidence | Document review. Runtime effects are described as could, not does. |
| Gate | Doc-changing mitigations go to pending_edits.md as PROPOSED. Approved docs are not edited here. |

## Assets and boundaries

| Asset | Boundary crossing |
|---|---|
| Published card JSON and images | Actions → Pages (trusted publish) |
| Upstream card/price/Genesys data | YGOPRODeck / Konami → Actions (untrusted input) |
| User credentials / session | Browser ↔ Supabase Auth (HTTPS) |
| Saved decks | Browser ↔ Supabase Postgres (anon key + RLS) |
| Share tokens | Public URL → Supabase lookup |
| Deck files (YDK/YDKE) | User file/clipboard → ExportCodec |
| Secrets (service role, OAuth client) | GitHub Actions / Supabase dashboard only |

## Threat register

| ID | Severity | Evidence | Threat (STRIDE-ish) | Impact | Mitigation / recommendation | Test |
|---|---|---|---|---|---|---|
| SR-01 | High | ARCH §6.5; ADR-006; R-07 | Misconfigured RLS or using the service role in the browser would expose all decks (Information disclosure / Elevation). | All users’ decks readable or writable. | Document: anon key only in the SPA; service role only in Actions and only for pipeline (never user tables); add a CI check that the client bundle does not contain `service_role`. | Bundle grep + S-02 negative RLS tests |
| SR-02 | High | ARCH §6.5; ADR-011; FR-35 | Client-only deletes (user JWT deletes own rows then auth user) can leave orphans if one step fails, or skip auth delete (Tampering / Denial of recovery). | Partial delete; re-login ghosts; shares still live. | Prefer one server-side delete-account function (security definer) that deletes shares, decks, then auth user; document in ARCH. | AC-07 asserts zero live rows |
| SR-03 | High | ARCH §6.5; R-08; ADR-007 | Share tokens without stated minimum entropy, or leaked via `Referer` when a share page opens a store link (Information disclosure). | Unauthorized deck read. | Require ≥128 bits entropy; `Referrer-Policy: no-referrer` (or strict-origin) on share routes; never put token in query for third-party navigations. | Header check + token length unit test |
| SR-04 | Medium | ARCH §6.5 CSP; ADR-001 | CSP allows `connect-src` only to Supabase, but OAuth redirects, `img-src`, and `script-src`/`style-src` for Vite/React are underspecified. Broken CSP could block auth or force unsafe-inline forever. | Auth break or XSS residual. | Publish a full CSP draft for `/otcp/` (script/style/img/connect/frame) and verify Google OAuth popup/redirect in S-02. | S-02 + header integration test |
| SR-05 | Medium | ADR-010; FR-31 | Hostile YDK/YDKE: huge files, binary content, millions of lines, ids outside catalog (Denial of service / Tampering). | Tab hang; corrupt deck state. | Cap file size and line count; UTF-8 text only; refuse unknown ids; parse in ExportCodec with hard limits; never `eval`. | Fuzz fixtures in Vitest |
| SR-06 | Medium | ARCH PriceView; FR-45 | Store URLs built from card names/ids without an allowlist could become `javascript:` or off-vendor links (Spoofing). | XSS-like navigation or phishing. | Build URLs only with fixed vendor origin templates and encoded query params; reject unexpected schemes. | Unit tests for URL builder |
| SR-07 | Medium | ADR-003; FR-54; NFR-05 | Poisoned or unexpected upstream images at build time could publish huge or non-image payloads (Tampering / DoS on Pages). | Site bloat or malicious content served same-origin. | Validate Content-Type and max bytes per image; rewrite to owned filenames; fail job on mismatch. | Pipeline fixture with bad image |
| SR-08 | Medium | ARCH §6.5; ADR-006 | Session in browser storage + XSS would steal accounts; guest drafts similarly exposed (Information disclosure). | Account takeover of signed-in user. | Keep CSP tight; sanitize any future user HTML; document that XSS is in-scope for UI hardening; prefer httpOnly session if Supabase SSR pattern is ever added (not required for v1 SPA). | axe + CSP + dependency audit |
| SR-09 | Low | ADR-003; R-06 | Actions fetch to YGOPRODeck/Konami without pinned hosts could become SSRF if a URL is ever parameterized (Spoofing / Elevation in CI). | Secret-bearing runner talks to attacker URL. | Pin allowlisted hosts in pipeline config; no user-controlled fetch URLs. | Pipeline config review |
| SR-10 | Low | ARCH §6.5; OD-10 | Provider backups within 30 days are trusted as platform behavior but not verified against Supabase’s current retention docs (Repudiation of “gone”). | Residual PII longer than claimed. | Cite Supabase backup retention in Notices or privacy blurb; re-check when plan changes. | Manual doc check each major release |

## Clean areas

- No runtime YGOPRODeck calls from the browser (NFR-05) removes a large XSS/supply-chain surface.
- HTTPS-only production (NFR-03) and static Pages hosting match the threat model.
- Share links are opaque and revocable (ADR-007); calendar TTL absence is an accepted product choice with R-08 noted.
- Service role “must not touch user decks” is already stated — needs mechanical enforcement (SR-01).

## Disclaimer

This is a design review of approved documents. It is not a penetration test, vulnerability scan, or guarantee of security.

## Boundary test

**Case:** Review with §6.5 Security baseline removed.

**Expected:** SR-01–SR-04 and SR-08 lose citations and must be reframed as “security baseline missing”; pipeline and import threats (SR-05, SR-07, SR-09) remain via ADR-003/010.

**Result:** Matched on a stripped working copy.

## Severity counts

| High | Medium | Low |
|---|---|---|
| 3 | 5 | 2 |
