# Spike S-01: Search and facet recount latency

## Question

Can a client-side in-memory index, as described in ADR-009 and ADR-012, return name or passcode search results and refresh facet option counts within 100 ms of the last keystroke or facet change, for the full Yu-Gi-Oh! card set?

The budget starts after the index is built. Index build time is recorded separately. It is not part of the 100 ms gate (NFR-01, architecture §6.1).

## Result

**Pass** on this emulation, at both 4× and 6× CPU throttle.

The pass rule is the slowest sample, not the median. At 6×, the slowest keystroke was **15.8 ms** and the slowest facet change was **7.3 ms**. Both are under 100 ms. The 4× run was faster. No ADR fallback was required.

This is **not** a measurement on the reference phone. See Environment.

## Method

The bench fetches `https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes` at run time (14,645 cards on 2026-10-28). The full response is not stored in the repo. A six-card fixture under `fixture/cards.json` covers the unit tests. The trimmed record keeps `id`, `name`, `desc`, `type`, `race`, `attribute`, `level`, `linkval`, `atk`, `def`, `archetype`, and TCG ban status (`banlist_info.ban_tcg`). The shape follows the sample in `docs/data/api-sample-accesscode-talker.json`.

The index is built in the page:

- Cards are sorted by name, so the first matching ids are already in name order.
- **Name.** Case-insensitive substring. Queries shorter than 3 characters scan the names. Longer queries intersect character-trigram bitsets (the indexed name is padded with spaces) and then check the substring, so trigram false positives are dropped.
- **Rules text.** Tokens of letters, digits, and apostrophes, length 3 or more. A multi-word query requires every token. Text matches are unioned with name matches (FR-02).
- **Passcode.** If the query is all digits, it prefix-matches the decimal id. Ids shorter than 8 digits are also matched on their zero-padded form (FR-03).
- **Facets.** One inverted bitset per option. Groups: type (API `type`), attribute, race, level (numeric level or rank, or `L{n}` when `linkval` is set), ATK bucket, DEF bucket, archetype, TCG ban status. ATK and DEF buckets are `?` (negative), `0`, `1–1000`, `1001–2000`, `2001–3000`, and `3001+`. A missing `ban_tcg` is Unlimited. Empty strings are not options (86 race values, 667 archetypes).
- **Counts.** Within a group, selected values are OR. Groups are AND. Each option's count ignores that group's own selection and keeps the query and the other groups, which is the rule in architecture §6.2. The hot path writes into reused bitset buffers.

Each timed keystroke or facet change does all of this, then keeps the first 50 ids:

1. Search.
2. Apply the current facet selection.
3. Collect up to 50 ids.
4. Recount every option in all eight groups.

The clock is `performance.now()` wall time, so CPU throttle shows up in the number. Garbage collection runs between index builds, not between keystrokes. One untimed warmup pass runs before samples are kept. There were 3 reps of the keystroke sequences (495 samples) and 8 reps of the facet steps (112 samples). Percentiles are nearest rank: p50 is `ceil(0.50 × n)`, p95 is `ceil(0.95 × n)`, 1-based, on the sorted samples.

Keystroke sequences, typed one character at a time, with no facet unless noted:

- `dark magician`, `ash blossom`, `blue-eyes`, `accesscode talker`, `nibiru`, `effect veiler`, `called by the grave`, `mirror force`, `pot of`, `zzzqqq` (no match)
- `dark magician` again with Attribute = DARK
- passcodes `89631139`, `46986420`, `14558127`, `86066372`, `27204311`

Facet steps: Effect Monster; plus DARK; plus Spellcaster; level 4; level 4–8; ATK 2001–3000; ATK and DEF 2001–3000; archetype Dark Magician; Forbidden; Limited or Semi-Limited; Spell plus Quick-Play; query `dragon` plus LIGHT; query `dark` plus Effect/Normal and archetype Dark Magician; clear all.

On-screen recount (type, attribute, race only) was measured as a comparison. It is not the pass rule. The pass rule recounts every group, including all 667 archetypes.

The timer stops when ids and counts are ready. It does not render React or paint a list. Virtualized painting is a separate ADR-009 concern and was not measured.

## Environment

Emulation only. Chromium was launched with the Playwright Pixel 5 descriptor (user agent, screen 393×851, CSS viewport 393×727, device pixel ratio 2.75) and CPU throttling through the DevTools Protocol, `Emulation.setCPUThrottlingRate`. A fixed 8,000,000-add loop checked that the throttle changed wall time:

| Setting | Loop time | Versus unthrottled |
|---|---:|---:|
| 1× | 34.6 ms | 1 |
| 4× | 147.3 ms | 4.3× |
| 6× | 219.6 ms | 6.3× |

`window.innerWidth` in this headless build read 980, which does not match the 393 CSS-pixel viewport. Screen width and the Playwright viewport did match Pixel 5. The latency figures come from the CPU throttle, not from the layout width.

RAM was not capped. Chrome reported `deviceMemory` 16 and 4 hardware threads, which is this machine, not a 6 GB phone. The heap growth below is the number to set next to a 6 GB phone.

| Item | Value |
|---|---|
| Date | 2026-10-28 |
| OS | Linux 6.12.94+ |
| CPU | Intel Xeon, 4 cores |
| Memory | 16 GB |
| Node | v22.23.4 |
| Chromium | 156.0.8078.4 (Playwright) |
| Cards | 14,645 from the cardinfo URL above |

## Raw results

Every sample is in [`results/s01-results.json`](results/s01-results.json). Times are milliseconds.

### 100 ms gate

Search + full facet recount + first 50 ids.

| Throttle | Work | n | min | p50 | p95 | max |
|---|---|---:|---:|---:|---:|---:|
| 4× | Keystroke | 495 | 0.60 | 4.40 | 5.50 | 6.80 |
| 4× | Facet change | 112 | 3.10 | 4.20 | 4.90 | 7.80 |
| 6× | Keystroke | 495 | 3.60 | 6.60 | 10.30 | 15.80 |
| 6× | Facet change | 112 | 5.20 | 6.20 | 7.00 | 7.30 |

Slowest 6× keystroke: passcode `46986420` at the first digit `"4"` (15.8 ms). Slowest 6× facet change: ATK and DEF set to 2001–3000 (7.3 ms).

### Parts of the same work (6×)

| Work | n | p50 | p95 | max |
|---|---:|---:|---:|---:|
| Search + 50 ids, no recount | 495 | 0 | 1.80 | 3.50 |
| Full recount only | 112 | 6.10 | 6.90 | 7.30 |
| Keystroke, on-screen groups only | 495 | 1.20 | 2.50 | 4.40 |
| Facet change, on-screen groups only | 112 | 1.00 | 1.60 | 2.10 |

One hot call per group after the timed reps, at 6×, empty query:

| Group | Options | ms |
|---|---:|---:|
| type | 29 | 0.1 |
| attribute | 7 | 0 |
| race | 86 | 1.1 |
| level | 20 | 0.1 |
| atk | 6 | 0 |
| def | 6 | 0 |
| archetype | 667 | 5.2 |
| banlist | 4 | 0 |

Archetype is most of a full recount. It still fits in the budget.

### Index build and size

Build is five samples after one warmup. `gc()` runs between builds.

| Throttle | min | p50 | p95 | max |
|---|---:|---:|---:|---:|
| 4× | 781 | 809 | 918 | 918 |
| 6× | 1,207 | 1,339 | 1,388 | 1,388 |

| Figure | Bytes |
|---|---:|
| Trimmed card JSON | 6,751,175 |
| Trimmed card JSON, gzip level 9 | 1,219,327 |
| Bitsets in memory | 34,254,736 |
| Bitsets, browser gzip | 728,591 |
| JS heap after build, minus heap before build (4× run) | 72,659,096 |

Heap growth is larger than the bitset bytes because of name strings, token maps, and typed-array headers. The 6× run's heap delta was 72,746,040 bytes. The published JSON is what the client would download. The bitset gzip figure is the packed arrays only, at the browser's default gzip level, not level 9.

Correctness checks on the full set: Dark Magician (`46986420`) by name and by passcode, Accesscode Talker (`86066372`) by passcode, and the DARK and DARK+Spellcaster counts matched a direct count of the trimmed cards (2,671 DARK).

## Pass / fail

**Pass.** Max keystroke and max facet change are under 100 ms at 4× and at 6×.

## Chosen fallback

None. Web worker, precomputed index, and lazy off-screen groups were not needed for the 100 ms budget.

Lazy off-screen groups would drop the recount to about 4 ms at 6× (on-screen max above). That remains the ADR-012 option if a later handset run misses the budget. It is not the recommendation from this run.

## Sources

- Card feed: [YGOPRODeck cardinfo v7, `misc=yes`](https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes)
- Sample record: `docs/data/api-sample-accesscode-talker.json`
- ADR-009, ADR-012, QS-01, R-01, architecture §6.1 and §6.2: `docs/ARCHITECTURE.md`
- NFR-01, FR-01, FR-02, FR-03, FR-57: `docs/SRS.md`
- Throttle: [Emulation.setCPUThrottlingRate](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setCPUThrottlingRate)

## Open questions

- The reference phone (mid-tier Android with about 6 GB of RAM, or an iPhone SE-class device) has not been measured. This run only throttled CPU on a 16 GB Xeon host.
- NFR-02 (first load within 2 s) was not the question. Build alone was about 1.3 s at 6×, and the trimmed JSON is 1.2 MB gzipped, before images and first paint. A handset load test still has to fit those into 2 s. A precomputed index would move build cost off the phone; this spike did not need that for the 100 ms gate.
- Archetype is the single YGOPRODeck `archetype` string, not every archetype a card is played in.
- Ban status is `ban_tcg` only (Unlimited, Limited, Semi-Limited, Forbidden). It is not a curated historical format list.
- Rules text is tokenized. It is not a substring search over the whole effect.
- Painting the result list in React was not timed.

## Proposed doc edits

Not applied. W-08 records these after the spikes.

**Architecture §6.1, §6.2, and §9.2, and SRS NFR-01.** Replace the S-01 "unverified until measured" line with:

> S-01 (2026-10-28) built the ADR-009 index (name trigrams, passcode prefix, rules-text tokens, facet bitsets) from the full YGOPRODeck cardinfo feed (`misc=yes`, 14,645 cards). In Chromium, with a Pixel 5 viewport and CPU throttling at 4× and 6×, the slowest keystroke was 15.8 ms and the slowest facet change was 7.3 ms, including a full recount of type, attribute, race, level, ATK, DEF, archetype, and TCG ban status. That is under the 100 ms budget. The run is an emulation, not the reference phone, so NFR-01 stays a target until a handset timing is recorded. ADR-009 and ADR-012 fallbacks were not required for the emulated budget. Index build was about 1.3 s (p50) at 6× and stays outside the 100 ms clock.

**R-01.** Keep the risk open until the handset run. Note that the emulation did not miss 100 ms, and that a handset miss still uses the ADR-009 fallbacks (worker, precomputed index, lazy off-screen groups), not a different view library (ADR-001).

## Reproduce

From the repo root, with Node 22:

```
npm run spike:s01
```

That writes `spikes/s01/results/s01-results.json`. `S01_KEY_REPS` and `S01_FACET_REPS` override the rep counts. `S01_CARDS_FILE` can point at a saved cardinfo JSON (`{ "data": [ ... ] }`) so the bench does not call the network. Unit tests use `fixture/cards.json` and do not need the feed.
