# Format snapshot sources and gaps (W-33)

Curated banlist JSON lives under `src/format/data/`. Spike S-03 (`spikes/s03/`) is the research record; this file tracks what shipped in the app and what is still open.

## GOAT

| Field | Value |
|---|---|
| Banlist effective date (`sortDate`) | 2005-04-01 |
| List source | [GoatFormat.com card pool & banlist](https://www.goatformat.com/cardpool.html) |
| Konami / historical check | [Yugipedia April 2005 Lists](https://yugipedia.com/wiki/April_2005_Lists) |
| Pool cutoff | 2005-08-31 (end of August 2005) |
| Pool source | Set list on GoatFormat.com through Dark Beginning 2 |

The app pool rule uses earliest TCG set date on or before the cutoff. That includes **Cybernetic Revolution** (2005-08-17) even though GoatFormat.com’s named set list omits it; see `spikes/s03/README.md`.

Rows with `uncertain: true` in `goat.json` are disputed passcode/image-id pairs (see `spikes/s03/gaps.json` G-04–G-07). Cards with no earliest TCG set date in the published index are excluded from the pool and treated as release-date gaps.

## HAT

| Field | Value |
|---|---|
| Banlist effective date (`sortDate`) | 2014-04-01 |
| List source | [HAT Format banlist](https://www.hatformat.com/banlist.html) |
| Konami archive | [April 1 – July 13, 2014 list](https://web.archive.org/web/20140825020840/http://www.yugioh-card.com/en/limited/Apr_2014.html) |
| Pool cutoff (chosen) | 2014-07-11 (July 11, 2014 NAWCQ per [about page](https://www.hatformat.com/about.html)) |
| Alternate pool ends (not chosen) | YGOPRODeck search through 2014-07-08 on [cardpool page](https://www.hatformat.com/cardpool.html); about-page span through 2014-08-15 (G-15) |

YGOPRODeck has no HAT ban field; legality uses the snapshot only (G-14). Uncertain snapshot rows: G-04, G-05, G-07–G-13 in `spikes/s03/gaps.json`.

## Tengu Plant

| Field | Value |
|---|---|
| Banlist effective date (`sortDate`) | 2011-09-01 |
| List source | [Tengu Format banlist](https://tenguformat.com/banlist/) |
| Konami archive | [Effective September 1, 2011](https://web.archive.org/web/20120226021414/http://www.yugioh-card.com/en/limited/11_09_list.html) |
| Pool cutoff | 2011-08-16 (Generation Force TCG date on YGOPRODeck; latest set named on [tenguformat.com](https://tenguformat.com/)) |

**Resolved:** Morphing Jar #2 on the community page is omitted; Konami September 2011 list matches the 134-row snapshot (G-01).

**Open:** Elemental HERO Grand Neos in `allCardsTengu.json` only (G-02). Four promo rows in `allCardsTengu.json` with post–Generation Force dates (G-16). Duplicate konamiCode rows in that file (G-17). Uncertain banlist rows: G-03, G-04, G-05, G-07–G-10, G-12.

## Edison

| Field | Value |
|---|---|
| Banlist effective date (`sortDate`) | 2010-03-01 |
| List source | [Yugipedia March 2010 Lists (TCG)](https://yugipedia.com/wiki/March_2010_Lists_(TCG)) |
| Community rules | [Edison Format banlist](https://edisonformat.net/rules/banlist) |
| Format Library cross-check | [Edison Format](https://formatlibrary.com/formats/edison) (March 2010 list heading) |
| Pool cutoff (chosen) | 2010-04-16 (Duelist Pack: Kaiba `tcg_date` on YGOPRODeck) |
| Alternate pool ends (not chosen) | Duelist Revolution (2010-08-17); community sites sometimes cite later 2010 sets — excluded here to match edisonformat.net |

The 132-row snapshot matches the March 2010 Forbidden / Limited / Semi-Limited tables on Yugipedia. YGOPRODeck has no Edison ban field; legality uses the snapshot only.

**Open:** edisonformat.net notes some Hidden Arsenal prints are not legal despite release timing; the app pool rule is earliest TCG set date only and does not model that exception. Cards with no earliest TCG date in the published set index are excluded from the pool (same as other historical formats).

## Release-date pool gaps

When a card has printings but none resolve to a `tcgDate` in the published set index, `isCardInFormatPool` excludes it from GOAT / HAT / Tengu / Edison. Those cards are not flagged in banlist JSON; they are pool-only gaps.

## Speed Duel

| Field | Value |
|---|---|
| Pool source | YGOPRODeck `format=Speed Duel` and `misc_info.formats` includes `Speed Duel` ([API Guide](https://ygoprodeck.com/api-guide/)) |
| Pool in app | Published `speedDuelLegal: true` on each card row after pipeline ingest (`misc=yes`) |
| Deck sizes | Main 20–30, Extra 0–6, Side 0–6 ([Konami Speed Duel Guide PDF](https://img.yugioh-card.com/en/downloads/rulebook/Speed_Duel_Guide_EN.pdf)) |
| Skill cards | `type=Skill Card`; at most one active Skill ([API Guide — Skill Card](https://ygoprodeck.com/api-guide/)) |
| Banlist effective date (`sortDate`) | 2026-07-10 (NA WCQ 2026 Speed Duel public list per [Yugipedia](https://yugipedia.com/wiki/July_2026_Lists_(Speed_Duel))) |
| Banlist in app | `banlistInfo.banSpeedDuel` when YGOPRODeck supplies `ban_speed_duel`; otherwise TCG `banTcg` fallback for cards in the Speed Duel pool |

**Open:** YGOPRODeck `banlist_info` documents only `ban_tcg`, `ban_ocg`, and `ban_goat`; there is no bulk `banlist=Speed Duel` API parameter. A curated Speed Duel snapshot JSON (like GOAT/HAT) is still outstanding when upstream adds a dedicated field or an export.

## Genesys

| Field | Value |
|---|---|
| Rules and point list source | [Konami Yu-Gi-Oh! GENESYS](https://www.yugioh-card.com/en/genesys/) |
| Stored Konami reference | `src/format/data/genesys-konami-points.json` (750 rows retrieved 2026-11-04) |
| Ingest field | YGOPRODeck `misc_info.genesys_points` mapped to `genesysPoints` at pipeline refresh |
| Spot-check | `pipeline/genesysPointsDiff.ts` logs diffs vs the stored Konami list; Konami values are never auto-applied (OD-11) |
| Default deck cap | 100, user-settable in the deck editor (OD-12) |

Point values in published card JSON follow YGOPRODeck until a maintainer updates data after reviewing Konami diff output.
