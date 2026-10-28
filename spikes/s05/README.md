# Spike S-05: Speed Duel Skill ids in public YDK

Question for ADR-010 and R-05: where do Speed Duel Skill cards show up in publicly shared `.ydk` files and `ydke://` strings? Under `#main`, under `#extra`, under `!side`, or left out? What should OTCP do on import and on export?

## Question

1. Do public Speed Duel decks put the Skill passcode under `#main`, `#extra`, `!side`, or omit it?
2. Does YGOPRODeck's own export and import do the same thing, and do EDOPro, Duelingbook, and Dueling Nexus document the same placement?
3. Does the YGOPRODeck card API give every `Skill Card` an `id` that those files can store?

## Method

Fetched on 2026-10-28. No local copy of EDOPro, Duelingbook, or Dueling Nexus was run. Placement below is from public responses and from source that those sites serve, not from a clicked Download button.

1. Skill catalog: `GET https://db.ygoprodeck.com/api/v7/cardinfo.php?type=Skill%20Card`, then the same call with `misc=yes`.
2. Card areas the YGOPRODeck deck builder uses: `GET https://db.ygoprodeck.com/api/v7/cardvalues.php`.
3. Public Speed Duel decks: the deck search page (`https://ygoprodeck.com/deck-search/`) calls `GET https://ygoprodeck.com/api/decks/getDecks.php?_sft_category=Speed%20Duel%20Decks` with `offset` 0, 20, 40, and so on. That URL is not in the API guide. It is the URL the search page builds. The category option value on that page is `speed duel decks`. Paging stopped at offset 400, which returned 18 decks. 418 decks, 418 distinct `deckNum` values, every `format` equal to `Speed Duel Decks`.
4. The list payload includes `main_deck`. It includes `extra_deck` or `side_deck` only when that section is non-empty. Four deck pages were opened and their `maindeckjs`, `extradeckjs`, and `sidedeckjs` arrays were compared with the list payload. Counts and Skill ids matched. The other 414 rows are from the list payload only.
5. Export functions read from the live scripts the pages load: `https://ygoprodeck.com/js/deck/deck.js?v=3.22` (SHA-256 `b4ea16cf5d8810e57759354f5708ee33e5d141fd1c882ff51a24904eddeb78e1`) and `https://ygoprodeck.com/decktool/app.js?v=7.10`.
6. EDOPro rules were read from `master` at `d0f111d6f3e0d4ee529b88a869ae0a971954bae3` (2026-10-16): `gframe/deck_con.cpp` and `gframe/deck_manager.cpp`. The program was not built or run.
7. Duelingbook and Dueling Nexus were checked from their public help and forum pages only. No file was exported from either site.
8. A web search for these Skill ids together with `ydk` did not return other public `.ydk` files. GitHub code search returned HTTP 429, so that search was not finished.

Sample `.ydk` files in `samples/` are rebuilt from the four deck pages' arrays with the same markers as `downloadYDK()` in `deck.js`: each marker is written with a trailing space, then CRLF, then one id per line. They are not a byte capture of the Download button.

`ydke://` strings below are rebuilt with the same steps as `createYdkeUri()` in that file: each id is a little-endian uint32, each section is Base64, and the URL is `ydke://` + main + `!` + extra + `!` + side + `!`. Decoding those strings returns the same ids as the page arrays. They were not copied from the clipboard button.

## Environment

| Item | Value |
| --- | --- |
| Date | 2026-10-28 |
| Machine | Linux 6.12.94+ x86_64 |
| Client | Python 3.12.3, HTTPS GET |
| EDOPro source | `edo9300/edopro` `master` `d0f111d` |
| Not run | EDOPro, Duelingbook, Dueling Nexus, the YGOPRODeck Download and Copy buttons |

## Raw results

### Skill cards in the YGOPRODeck API

`type=Skill Card` returned 124 cards. Every card has integer `id`, `type` `Skill Card`, and `frameType` `skill`. Every `id` is 9 digits. The minimum is 300101001. The maximum is 300302076. All 124 ids are unique. Each card's `card_images[].id` includes that same id. There is no separate passcode field. The API guide calls `id` "ID or Passcode" and also says the `id` parameter is an 8-digit passcode. These Skill ids are 9 digits, so that 8-digit sentence does not describe them.

With `misc=yes`, `misc_info.konami_id` is null on 53 cards and a negative integer from -71 to -1 on the other 71. It is never equal to `id`. The numbers stored in the public decks are the 9-digit `id` values, not `konami_id`. Whether that 9-digit number is printed on the physical card was not checked.

`cardvalues.php` lists one Skill type:

| name | group | area |
| --- | --- | --- |
| Skill Card | SKILL | MAIN, SIDE |

`EXTRA` is not in that area list. The deck builder in `app.js` (`v=7.10`) will only add a card to a section listed in `area`. It also refuses a second card whose category is Skill anywhere in the deck (`getAllCards`). So the builder can place one Skill in Main or in Side, and it will not place one in Extra.

### How YGOPRODeck writes YDK and YDKE

`downloadYDK()` in `deck.js` does not look at card type. It writes `maindeckjs` under `#main `, `extradeckjs` under `#extra `, and `sidedeckjs` under `!side `. The marker strings include a trailing space, and the line ending is CRLF. A Skill id is written only if it is already in one of those three arrays.

`createYdkeUri()` uses the same three arrays. There is no fourth Skill segment.

The deck builder's `toFile` writes `#main`, `#extra`, and `!side` with no trailing space, joined by `\n`, and emits each card's `passcode`. Its `fromFile` splits on newlines, trims each line, and appends a known passcode to whatever section the last marker named. It does not move a Skill into a different section, and it does not check `area` on import. An unknown passcode is reported missing. It is not a hard failure of the whole file.

### Public Speed Duel decks

418 decks. Each deck has exactly one of these shapes. No deck has two Skill ids, and no deck repeats one Skill id.

| Skill placement | Decks |
| --- | --- |
| `#main` only | 416 |
| `!side` only | 1 |
| omitted | 1 |
| `#extra` | 0 |

112 of the 124 Skill ids appear at least once. After the single Main Skill line is removed, every deck's main count is between 20 and 30, including the deck with no Skill and the deck whose Skill is in Side.

The list API's `submit_date` is a relative label such as `1 year ago` at fetch time. Absolute dates below are `datePublished` from the deck page.

| Deck | Published | Main / Extra / Side lines | Skill |
| --- | --- | --- | --- |
| [Yami Bakura starter](https://ygoprodeck.com/deck/official-speed-duel-starter-decks-twisted-nightmares-yami-bakura-738649) | 2026-10-15 | 31 / 0 / 0 | `300205001` Inner Conflict, in main |
| [Hero speed duel deck](https://ygoprodeck.com/deck/hero-speed-duel-deck-718463) | 2026-06-25 | 23 / 6 / 2 | `300302050` HEROES UNITE - FUSION!!, in main |
| [Kintama Break](https://ygoprodeck.com/deck/kintama-break-310934) | 2022-11-25 | 24 / 2 / 1 | `300201002` Destiny Draw (Skill Card), in side only |
| [Lumis and Umbra](https://ygoprodeck.com/deck/speed-duel-lumis-and-umbra-594744) | 2025-04-22 | 23 / 0 / 0 | none. The page text does not name a Skill either |

Fourteen decks whose names contain "Official" all put one Skill id under main. Those are public uploads with those titles, not files fetched from Konami.

Per-deck passcode and section for all 418 rows: `corpus.json`. Id and name for all 124 Skill cards: `skill-cards.json`.

Rebuilt `ydke://` strings (little-endian, from the page arrays):

| Deck | Where the Skill id decodes |
| --- | --- |
| Yami Bakura | Main segment. Extra and side segments are empty. `ydke://wazlAYBmLQR+Lv4DJBEfA6jBewU/Wg4E4OpSANrx/wNwOMMD6SVDAjC2NwMlXHgCUGX7AB3MQAUzeeYEKdO7BLPSEACsCXQEZn65ASeO2QEAajYCyG4lAYH8vAIBSwoAbu1jBe+CFgAhk7IEJnPCBDd1aQLxd6cFycPkEQ==!!!` |
| Hero | Main segment. Extra and side are non-empty and contain no Skill id. `ydke://4j7mEWBSTQFgUk0Bhz2DA4c9gwMIMTwBCDE8AaG7BgWxL+EET3p9A33hYgC9p28BvadvAb2nbwE22KYFNtimBe8nUQD0fVsF9H1bBXnxkwJ58ZMCJtjBAybYwQM=!7mciAtQPgwF+lSoFK68dAAXlTgFXD9kA!DjnCA/9o2AI=!` |
| Kintama Break | Side segment only (`300201002`). `ydke://rvTMAq70zAKu9MwCobsGBbRG5QC0RuUA2vH/A9rx/wOnJKkE4VZEAt/xzAHxRocDHqryBb2nbwFolc8ApT9rBHjBkwRCQZ0EQkGdBDVw2gAw2AYC3OeQBbYegAEvHIsC!4QXfBeEF3wU=!KrTkEQ==!` |
| Lumis and Umbra | No Skill id in any segment. `ydke://x+bqAr0kNAW6r9AAofAoBbV4swCqut0Aw8nUAOKZ9wDk5wsC3ansApRACgES0OkEogBZAZgaxwAfFaAFQHKiBI03cwPANIwEOc9/AjW9fwKV9mQD/EssABjjegU=!!!` |

### EDOPro

Read from source at `d0f111d`, not executed.

`DeckManager::SaveDeck` writes `#created by ...`, then `#main`, `#extra`, and `!side`, and writes each card's code with `getRealCode()`. A Skill is just another code in whichever vector holds it. There is no `#skill` section.

`ExportDeckYdke` Base64-encodes the main, extra, and side code arrays in host byte order. The YGOPRODeck script forces little-endian. They match on a little-endian machine. A big-endian build was not checked.

`DeckBuilder::push_main` allows a Skill, and refuses a second Skill in main unless the add is forced. `push_extra` returns false for a card that is not a Fusion, Synchro, Xyz, Link, or Rush Ritual, so a pure Skill cannot be dragged into Extra. `push_side` has no Skill cap. It stops at 15 cards.

`CheckDeckContent` reports too many Skills when main contains more than one `TYPE_SKILL`. It does not count Skills in side or extra for that check. `CheckDeckSize` subtracts the main Skill count from the main size, so a Skill in main does not count toward the main-deck size. A Skill in side counts toward the side size.

`LoadDeck`, when the file has an extra section, appends every `#extra` code to extra, including a Skill id. It appends every `!side` code to side. A Skill id under `#main` stays in main, because a Skill is not an extra-deck type. So a file can load a Skill into extra even though the editor will not let you drag one there. No such file was in the 418.

`LoadCardList` treats a line as the extra marker only when it is exactly `#extra`. `downloadYDK()` writes `#extra ` with a trailing space. After CRLF is stripped, that line is not exact, so EDOPro would keep the following ids in main until a line that is exactly `#extra` or a line that starts with `!`. A Skill under `#main` still lands in main, because main is the default section. The deck builder's `toFile` writes `#extra` with no trailing space, which does match.

An older commit, `f2ca773` (2022-05-24), said one Skill could sit in main or extra and that side had no Skill limit. Current `push_extra` no longer matches that commit message. The 2022 sentence is not the current editor rule.

### Duelingbook

The welcome page documents YDK file import and export, and YDKE import and export. It does not say where a Skill id goes. The Speed Duels page says each player can have one Skill Card, placed near the field at the start of the Duel. It does not describe the file.

On 2024-01-13, in [Browse and save Speed Duel Skill cards in the Deck Explorer](https://forum.duelingbook.com/viewtopic.php?p=102017), a user asked to save Skill cards in the Deck Constructor. Jon-Stark replied: "You select your skill card at the beginning of your duel." The next post says that means the choice is made again at every duel start. The thread's last post is 2024-02-17. Nothing on that page says a Skill id was later added to the saved deck or to the YDK export. A Duelingbook `.ydk` was not downloaded. Whether a 2026 export contains a Skill passcode is unverified.

### Dueling Nexus

The public FAQ still contains this answer, posted 2019-08-02: "Will Nexus add speed/turbo/duel link format/anime cards/manga cards? NO! Nexus has explicitly stated that the site will only be master rule style, aka the official main trading card game, this means no anime effects, or speed duels." Source: [Frequently Asked Questions](https://duelingnexus.forumotion.com/t14-frequently-asked-questions). The same page describes a userscript that downloads a deck as `.ydk`. It does not mention Skill cards. A Nexus file was not downloaded. Skill placement there is out of scope for their stated product, and the bytes are unverified.

## Pass / fail

Pass, with two exceptions in 418 decks.

The target was to confirm that Skill ids appear under `#main`, as in YGOPRODeck `downloadYDK`. That holds for 416 of 418 public Speed Duel decks, and `downloadYDK` writes the main array under `#main` with no special Skill section. It does not hold for every deck: one Skill sits only under `!side`, and one deck omits the Skill. Zero Skills sit under `#extra`.

Every returned Skill Card has an `id` that the decks actually store. That part passes. The ids are 9 digits, which the API guide's "8-digit passcode" wording does not cover.

## Rule for OTCP

Import, covering every placement in this corpus:

- A Skill id under `#main`, or in the YDKE main segment, is the active Skill. Do not count it toward Main size.
- A Skill id under `!side`, or in the YDKE side segment, with no Skill id in main, is the active Skill. That is the Kintama Break shape. One deck, one Skill, side only.
- No Skill id in any section means no Skill. Do not invent one. That is the Lumis and Umbra shape.
- There is no `#skill` marker to read. None of these files has one.
- `#extra` was not a Skill placement here. Do not require it.

Export:

- Write the active Skill id under `#main`, one id per line, using the 9-digit `id` from the card catalog.
- Write the markers as `#main`, `#extra`, and `!side` alone on their lines, with no trailing space, and use `\n`. The deck builder's `toFile` does this. `downloadYDK()` adds a trailing space and uses CRLF. The deck builder's importer trims, so it accepts both. EDOPro recognizes Extra only when the line is exactly `#extra`, so the no-space form is the one that keeps Extra cards in Extra there. A Skill under `#main` is in the default section either way.
- YDKE uses the same three segments. Put the Skill id in the main segment as a little-endian uint32. These 9-digit ids fit in uint32. There is no fourth segment.

Fallback if a consumer rejects a Skill id in `#main`: write that same id under `!side` instead. That is the only other section where a Skill id was found, and it is a section both the YGOPRODeck builder (`area` includes SIDE) and EDOPro `push_side` accept. Do not use `#extra` as the fallback. The builder's area list omits EXTRA, EDOPro's editor refuses to drag a pure Skill there, and the corpus has no example.

## Sources

- YGOPRODeck API guide, `id` described as passcode, and the 8-digit wording: https://ygoprodeck.com/api-guide/
- Skill catalog: https://db.ygoprodeck.com/api/v7/cardinfo.php?type=Skill%20Card
- Card areas: https://db.ygoprodeck.com/api/v7/cardvalues.php
- Deck search and its list URL: https://ygoprodeck.com/deck-search/ and https://ygoprodeck.com/api/decks/getDecks.php?_sft_category=Speed%20Duel%20Decks
- Deck page export script: https://ygoprodeck.com/js/deck/deck.js?v=3.22
- Deck builder: https://ygoprodeck.com/deckbuilder/ and https://ygoprodeck.com/decktool/app.js?v=7.10
- EDOPro `master` `d0f111d`: https://github.com/edo9300/edopro/blob/d0f111d6f3e0d4ee529b88a869ae0a971954bae3/gframe/deck_manager.cpp and https://github.com/edo9300/edopro/blob/d0f111d6f3e0d4ee529b88a869ae0a971954bae3/gframe/deck_con.cpp
- Older EDOPro note, not the current editor rule: https://github.com/edo9300/edopro/commit/f2ca7735362a4dea3be43733ac29d43f3aeb238d
- EDOPro FAQ (Alternate Formats shows Skill cards in the editor; it does not name the YDK section): https://projectignis.github.io/faq.html
- Duelingbook welcome (YDK and YDKE import/export): https://www.duelingbook.com/welcome
- Duelingbook Speed Duels: https://www.duelingbook.com/speed-duels
- Duelingbook forum, Skill not saved in the constructor as of that thread: https://forum.duelingbook.com/viewtopic.php?p=102017
- Dueling Nexus FAQ: https://duelingnexus.forumotion.com/t14-frequently-asked-questions

## Open questions

- Duelingbook YDK and YDKE bytes for a Speed Duel deck were not downloaded. The 2024 forum thread says the Skill is chosen at duel start. Whether a current export contains a passcode is unverified.
- Dueling Nexus says it does not support Speed Duels. What its YDK upload does with a 9-digit Skill id was not tested.
- EDOPro was not run. The extra-marker trailing-space behavior and `push_extra` are from source at `d0f111d` only.
- YDKE Base64 in EDOPro uses host endianness. Agreement with YGOPRODeck is for little-endian hosts. Big-endian was not checked.
- No `ydke://` string was copied from a live clipboard. The four strings above are rebuilt from the page arrays.
- 414 of 418 decks were not re-read from the deck page HTML. The four that were re-read matched the list API.
- GitHub code search did not complete (HTTP 429). Other public `.ydk` hosts may exist and were not collected.
- A file with one Skill in `#main` and another in `!side` was not in this corpus. Physical play allows extra Skills in the Side Deck. The YGOPRODeck builder refuses a second Skill anywhere. If such a file shows up, a reasonable reading is: the `#main` id is the active Skill, and the `!side` id is a side Skill. That combination is unverified here.
- A Skill id under `#extra` was not in this corpus. EDOPro's loader would keep it in extra. The builder would not create it. Not part of the import rule above.
- `konami_id` is negative or null. The printed passcode on the paper Skill card was not checked.

## Proposed doc edits

Not applied. SRS, architecture, UI, and the implementation plan stay as they are.

ADR-010, decision, proposed wording:

Export writes the active Speed Duel Skill id under `#main`, one id per line, using the card's YGOPRODeck `id`. Markers are `#main`, `#extra`, and `!side`, each alone on its line. YDKE uses those same three segments and has no Skill segment. Import accepts a Skill id under `#main` or under `!side`, and accepts a deck with no Skill id. A Skill id under `#main` does not count toward Main size. If the only Skill id is under `!side`, it is the active Skill. Fallback: if a consumer rejects a Skill id in `#main`, write it under `!side`.

Deck rules reference, Speed Duel Skill row, proposed wording:

At most one active Skill. It does not count toward Main size. Export puts that id under `#main`. Import also accepts the id under `!side`, and accepts no Skill.

Deck export formats reference, YDK row, proposed wording:

`.ydk` with `#main`, `#extra`, and `!side`, one id per line, markers without a trailing space. The Speed Duel Skill id is under `#main` on export. Import maps a Skill id in `#main` or, when that is the only Skill id, in `!side`, to the Skill slot.

FR-17, FR-28, and FR-31, proposed change:

Keep export under `#main`. Extend import so a Skill id found only under `!side` still fills the Skill slot, and a file with no Skill id stays Skill-empty. Add the `!side` fallback sentence to the export requirement.

S-05 row in the UNVERIFIED list: settled as above. `#extra` for a Skill remains unverified because it was not observed.
