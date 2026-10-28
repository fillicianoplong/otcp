# Spike S-03: Goat, HAT, and Tengu banlist snapshots

## Question

Can the Goat, HAT, and Tengu Plant banlists be saved as owner-controlled files the app could load later, with a passcode on each row, the community source and list date, the card-pool cutoff the source gives, and a gap list for rows that do not match?

This settles ADR-004 and R-03. Plan item W-05.

## Method

Community pages named in the SRS were read on 2026-10-28.

- Goat: the Card Pool & Banlist page on goatformat.com. That page prints the forbidden, limited, and semi-limited names.
- HAT: the banlist, cardpool, and about pages on hatformat.com. The banlist is a list of card links.
- Tengu: the banlist page on tenguformat.com. The page text is one labeled list. The same page loads `tengubanlist.ydk`. The site also publishes `allCardsTengu.json` (last-modified 2025-08-28), which has a legality field. The YDK does not label its three sections. Comparing the ids with the labeled text shows `#main` as forbidden, `!side` as limited, and `#extra` as semi-limited.

Names were matched to YGOPRODeck `cardinfo.php` (v7). The match folds case, turns a curly apostrophe into a straight one, and treats a hyphen, en dash, em dash, and fullwidth hyphen as the same mark, including spaces around it. A row was given a passcode only when that match hit one card. The snapshot `id` is that card's id. `passcode` is the id padded to 8 digits. `name` is the YGOPRODeck name. `status` is `forbidden`, `limited`, or `semi-limited`. `note` is empty unless the row needs a flag.

Goat statuses were compared to `banlist_info.ban_goat`. The API values are Forbidden, Limited, and Semi-Limited. HAT and Tengu have no field there. Their statuses were compared to archived Konami list pages. Yugipedia's transcription of the same lists was a second check. Format Library was not used to fill rows. It was checked only for the Morphing Jar #2 decision in G-01.

A card the community banlist page does not name was not added. The one exception is Magical Scientist, and it is flagged (G-03). Morphing Jar #2 is the other way around: the Tengu page names it, and it was left out (G-01, resolved).

## Environment

| Item | Value |
|---|---|
| Date of the reads | 2026-10-28 |
| OS | Linux 6.12.94+ |
| Node | 22.23.4 (`.nvmrc` is 22) |
| YGOPRODeck | API v7, `cardinfo.php` and `cardsets.php` |

The snapshot files are data. Node is here because the repo check runs on Node 22. No package was added.

## Raw results

| Check | Goat | HAT | Tengu Plant |
|---|---|---|---|
| Community rows in the snapshot | 73 (17 forbidden, 41 limited, 15 semi-limited) | 162 (77, 71, 14) | 134 (51, 65, 18) |
| Passcodes matched | 73 | 162 | 134 |
| Unmatched names | 0 | 0 | 0 |
| YGOPRODeck ban field | `ban_goat`: 73/73 names and statuses | none | none |
| Dated list | Yugipedia April 2005 Lists: 73/73 | Archived Konami page, April 1–July 13, 2014: 162/162 | Archived Konami page, September 1, 2011: 134/134 |
| Disputed snapshot rows | 0 | 0 | 0 |

Files:

| File | Role |
|---|---|
| `goat.json` | Goat snapshot |
| `hat.json` | HAT snapshot |
| `tengu.json` | Tengu Plant snapshot |
| `gaps.json` | Flagged rows. `unmatchedPasscodes` is empty |

Goat. goatformat.com says every version of the format uses the April 2005 TCG list. The same page lists 73 names. Those 73 names and statuses match `ban_goat`, and they match the Yugipedia April 2005 list. The calendar window April 1, 2005 through September 30, 2005 is from that Yugipedia page. goatformat.com does not print the day. The Upper Deck appendix cited there was not reopened.

The Goat pool is the set and promo list on that page: cards legal for premier play on August 17, 2005, through Dark Beginning 2. Cybernetic Revolution is not in the list. YGOPRODeck's set feed dates Cybernetic Revolution 2005-08-17, the same day as the event sentence. The set list is the cutoff. For all 73 banlist cards, the earliest joined YGOPRODeck set date is on or before 2005-03-01.

HAT. hatformat.com says it follows the July 2014 NAWCQ and the April 2014 TCG list. The 162 names match the archived Konami page for April 1, 2014 through July 13, 2014, updated March 19, 2014. One Limited row on that page, Wall of Revealing Light, is missing its opening table-row tag. The cells are there and say Limited. Yugipedia's April 2014 TCG list matches as well, except it writes "Morphing Jar 2" where Konami, hatformat.com, and YGOPRODeck use "Morphing Jar #2". That is the same card.

HAT names already used the YGOPRODeck spelling, so no dash rewrite was needed. `banlist_info` cannot confirm HAT status (G-14).

The HAT pool is not one sentence. The about page says May 16, 2014 through August 15, 2014, and says the site follows the July 11, 2014 NAWCQ. The cardpool page links a YGOPRODeck search that ends 2014-07-08. Those statements disagree (G-15). This spike snapshots the banlist, not every legal card.

Tengu. The home page says Generation Force is the latest set, and that the format uses the September 2011 card pool and banlist. There is no separate card-pool page. YGOPRODeck dates Generation Force 2011-08-16. That date is not printed on tenguformat.com. The Konami archive says the list is effective September 1, 2011. The end date February 29, 2012 is from Yugipedia only.

Eleven Tengu page names differ from YGOPRODeck only by a dash or an apostrophe (for example "Blackwing – Gale the Whirlwind"). After the fold above, each hit one card. The page also contains the single word "Magical" where the other sources have Magical Scientist (G-03).

The Tengu page and `allCardsTengu.json` also name Morphing Jar #2 as semi-limited. The archived Konami list does not, and it lists only Morphing Jar at limited. Format Library's Tengu list agrees with Konami. That community-page entry is treated as an error, so the card is not in the snapshot (G-01, resolved). The site's YDK already omitted it.

`allCardsTengu.json` also marks Elemental HERO Grand Neos limited. The banlist page, the YDK, and the Konami list do not. It is not in the snapshot (G-02). Four passcode strings in that file are stored twice, with and without a leading zero, and the two rows disagree (G-17). The banlist page agrees with one row of each pair. The snapshot follows the page. The file has 5035 rows, so it is not a clean count of the pool. Four Unlimited cards in it are dated after 2011-08-16 (G-16).

`banlist_info` keys on the full `cardinfo.php` response were `ban_tcg`, `ban_ocg`, and `ban_goat` only.

Ten cards on these lists have two image ids at YGOPRODeck. Monster Reborn is the sharp case: `cardinfo.php` used id 83764719, and `cardinfo.php?banlist=goat` used 83764718. Both responses say goat Forbidden. The snapshot uses 83764719 (G-04 through G-13).

## Pass/fail

Pass.

The three snapshot files exist. Every snapshot row has one passcode. The unmatched list is empty. Morphing Jar #2 is resolved and is not in the Tengu file (G-01). Elemental HERO Grand Neos stays an open gap and is not in the snapshot (G-02).

Goat is the clean list: 73 rows, same names and statuses as `ban_goat`. HAT is 162 rows and matches the archived April 2014 Konami page; the API cannot confirm the status. Tengu is 134 rows and matches the archived September 1, 2011 Konami list.

## Fallback

No fallback was required.

If a name had matched zero cards or more than one, that row would have kept a null id and a flag, and it would not have been given a guessed passcode. That did not happen. A card named only inside `allCardsTengu.json`, and missing from the banlist page and the Konami list, stays out of the snapshot. That is what happened to Elemental HERO Grand Neos.

## Sources

| Source | Used for | Link |
|---|---|---|
| GoatFormat.com, Card Pool & Banlist | Goat names, statuses, and pool | https://www.goatformat.com/cardpool.html |
| HAT Format banlist | HAT names and statuses | https://www.hatformat.com/banlist.html |
| HAT Format cardpool | HAT pool link | https://www.hatformat.com/cardpool.html |
| HAT Format about | HAT dates and event | https://www.hatformat.com/about.html |
| Tengu Format banlist | Tengu names and statuses | https://tenguformat.com/banlist/ |
| Tengu Format home | Pool sentence | https://tenguformat.com/ |
| Tengu `tengubanlist.ydk` | Passcodes the banlist page loads | https://tenguformat.com/wp-content/uploads/decks/tengubanlist.ydk |
| Tengu `allCardsTengu.json` | Conflicting legality rows | https://tenguformat.com/wp-content/uploads/database/allCardsTengu.json |
| YGOPRODeck API v7 | Passcodes, `ban_goat`, set dates | https://ygoprodeck.com/api-guide/ |
| Konami list, archived | HAT status check, April 1–July 13, 2014 | https://web.archive.org/web/20140825020840/http://www.yugioh-card.com/en/limited/Apr_2014.html |
| Konami list, archived | Tengu status check, effective September 1, 2011 | https://web.archive.org/web/20120226021414/http://www.yugioh-card.com/en/limited/11_09_list.html |
| Yugipedia, April 2005 Lists | Goat window and a second name check | https://yugipedia.com/wiki/April_2005_Lists |
| Yugipedia, September 2011 Lists (TCG) | Tengu end date February 29, 2012 | https://yugipedia.com/wiki/September_2011_Lists_(TCG) |
| Yugipedia, April 2014 Lists (TCG) | Second HAT name check | https://yugipedia.com/wiki/April_2014_Lists_(TCG) |

## Open questions

1. Which HAT pool end should the format file use: the July 8, 2014 search link, the July 11, 2014 event, or the August 15, 2014 span?
2. Are Blizzard Princess, Meklord Emperor Wisel, The Tyrant Neptune, and Malefic Truth Dragon in the Tengu pool, or is `allCardsTengu.json` wider than "Generation Force as the latest set"?
3. When a card has two image ids, which one should passcode search accept besides the snapshot id? Monster Reborn's primary id also differed between two API calls on the same day.
4. Should the curated banlist schema use these keys: `formatId`, `effectiveDate`, `source`, `cardPool`, and `cards[]` of `id`, `passcode`, `name`, `status`, `note`?

## Proposed doc edits

Not applied. Wording for the later doc pass:

SRS, the UNVERIFIED line on Goat, HAT, and Tengu snapshots. Replace with: "S-03 saved Goat, HAT, and Tengu banlist snapshots under spikes/s03/. Goat (73) matches YGOPRODeck ban_goat. HAT (162) matches the archived April 1, 2014 Konami list. Tengu (134) matches the archived September 1, 2011 Konami list. Morphing Jar #2 on the Tengu community page was left out. Copy the chosen rows into the format files before release."

SRS, Formats reference, goat / hat / tengu rows. Add the cutoff from each snapshot's `cardPool`, and point the status check at spikes/s03/. Leave the list names as April 2005, April 2014, and September 2011.

Architecture, R-03. Add: "S-03 wrote the three snapshots and a gap list. Morphing Jar #2 is resolved and is not in the Tengu snapshot. The open part of this risk is the remaining gap rows, including the HAT pool end date, not a missing file."

Architecture, section 9.2, the Goat / HAT / Tengu bullet. Replace with: "S-03 recorded the snapshots. Goat matches ban_goat. HAT and Tengu statuses are not in YGOPRODeck banlist_info. Tengu matches the September 1, 2011 list. Open gaps remain in spikes/s03/gaps.json."

Architecture, banlist snapshot schema. Proposed keys are the ones in open question 4. Status is `forbidden`, `limited`, or `semi-limited`. Unknown keys stay refused once that set is approved.
