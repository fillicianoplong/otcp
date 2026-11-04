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

## Release-date pool gaps

When a card has printings but none resolve to a `tcgDate` in the published set index, `isCardInFormatPool` excludes it from GOAT / HAT / Tengu. Those cards are not flagged in banlist JSON; they are pool-only gaps.
