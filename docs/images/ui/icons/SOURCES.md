# Yu-Gi-Oh! UI icons — sources

**Copyright:** Konami / 4K Media. Used as provided for OTCP mockups and product UI.

**Owner pack (2026-10-28):** Filliciano supplied the official high-res set (Attribute, Race, Level, Limit, Misc/CardBack, Rarity, Type). Untouched originals: `source-owner/`. Live assets are normalized under kind folders with lowercase kebab-case names, transparent PNG where needed, and 64 / 128 / 192 (`@2x` / `@3x`) scales for row icons.

Prior low-res or superseded copies were **moved** (not deleted) to `fallback/pre-owner-pack-20261028/` and other `fallback/` archives.

## Layout

| Folder | Contents |
| --- | --- |
| `attribute/` | dark, light, earth, water, fire, wind, divine |
| `race/` | Monster types (aqua … zombie), including sea-serpent, winged-beast, beast-warrior, divine-beast |
| `spell-trap/` | Property icons (normal, continuous, quick-play, equip, field, ritual, counter) + spell / trap type badges |
| `level/` | level star |
| `link/` | Link marker (base + presets + SVG) |
| `ban/` | Master Duel Forbidden / Limited / Semi-Limited / Unlimited |
| `rarity/` | normal, rare, super-rare, ultra-rare (stored; not yet in mocks) |
| `frame/` | Card-frame type art (effect-monster, link-monster, …) |
| `misc/` | atk, def (approved MD redraws); card-back + thumbs |
| `source-owner/` | Exact owner zip contents |
| `svg/` | Ban + ATK/DEF SVG masters |
| `fallback/` | Superseded assets |

## Per-kind notes

| Kind | Path used | Source / decision |
| --- | --- | --- |
| Attribute | `attribute/{id}.png` (+@2x/@3x) | Owner `Attribute/*.jpg` (PNG data); background cut to transparency |
| Race | `race/{id}.png` (+@2x/@3x) | Owner `Race/*.png` monster types |
| Spell/Trap property | `spell-trap/{id}.png` (+@2x/@3x) | Owner `Race/{Continuous,Normal,…}.png` |
| Spell/Trap badge | `spell-trap/spell.png`, `trap.png` | Prior official small badges (scaled); full frames under `frame/` |
| Level | `level/level.png` | Owner `Level/level.png` is **20×20**, identical to the prior star — **kept**. Soft at row size; no sharper Level/Rank in the pack |
| ATK / DEF | `misc/atk.png`, `misc/def.png` | **Unchanged** — approved MD geom-v2 sword + shield |
| Ban | `ban/{forbidden,limited,semi-limited,unlimited}.png` | **Kept** approved Master Duel set (complete Forbidden + Unlimited). Owner `Limit/limited_0/1/2.png` archived only — incomplete vs product rules |
| Rarity | `rarity/*.png` | Owner pack; future list/detail marks |
| Frame | `frame/*.png` | Owner `Type/*.jpg`; future detail chrome. **Missing from pack:** Fusion, Ritual monster, Normal monster, Tuner-only, non-effect Pendulum, Token; also no Rank star or Link arrow marker |
| Card back | `misc/card-back.jpg` + `card-back-thumb*.jpg` | Owner `Misc/CardBack.jpg` — used as ART placeholders in list/grid/thumbs |

## Contact sheet

`icons/icon-contact-owner.png` — attributes, races, and Spell/Trap properties at row size on light and dark.

## Link marker (2026-10-28)

| Path | Notes |
| --- | --- |
| `source-owner/link/link-marker.png` | Owner-supplied pixel-art Link marker (1189×1189; native 29×29 art grid) |
| `link/base.svg` | Per-pixel SVG; `<g id="arrow-{dir}">` for each of 8 directions; frame group separate |
| `link/link-marker.png` (+@2x/@3x/@detail) | All-gray base, nearest-neighbor |
| `link/link-3-top-bl-br.png` | Sample Link Iota: Top + Bottom-Left + Bottom-Right lit red |
| `link/link-marker-map.json` | Pixel map for `docs/data/games/yugioh/render_link_marker.py` |
| `link-marker-compare.png` | Row + detail sizes; several arrow combos on light/dark |

Active arrows: light-red highlight + mid-red fill + dark-red outline (mirrors gray two-tone). Inactive stay gray. Center stays light blue — Link rating shown as adjacent **Link-N** text at row size (number inside the center does not read at 16px).

## Frame-mini (card-type glyphs) — 2026-10-28

Owner supplied four Master Duel–style mini card-frame screenshots under `Frames-mini/` (copied to `source-owner/frame-mini/`). Each glyph was cut on its own pixel boundary (dark outer-border bbox, white/odd background flooded to transparent, stray partial neighbors ignored). Nearest-neighbor 2×/3×.

| Id | Color cue | Source sheet |
|---|---|---|
| normal | yellow | 01M61KE1… |
| effect | orange-brown | 01M61KE1… |
| fusion | purple | 01M61KEA… (right edge; border intact) |
| synchro | white/silver | 01M61KDQ… |
| xyz | black | 01M61KDH… |
| link | dark blue | 01M61KEA… |
| token | gray | 01M61KE1… |
| spell | green | 01M61KEA… |
| trap | pink/magenta | 01M61KDH… |
| pendulum-effect | orange top / green bottom | 01M61KE1… |
| pendulum-xyz | black top / green bottom | 01M61KEA… |

**Not in pack (no glyph cut):** ritual, pendulum-normal, pendulum-synchro, pendulum-fusion.

Crop check (4× on checkerboard): `frame-mini-crop-check.png`.

These **replace** the prior Spell/Trap type badges (`spell-trap/spell.png`, `spell-trap/trap.png`) in list/detail rows; those files moved to `fallback/pre-frame-mini-spell-trap-type-20261028/`. Spell/Trap **property** icons remain under `spell-trap/`.

## Link marker — size + runtime (2026-10-28)

Owner pixel-art marker (29×29 map). Presets only under `icons/link/` (`base.svg`, `link-marker`, `link-1-bottom`, `link-3-top-bl-br`, `link-4-left-right-bl-br`). Generator: `docs/data/games/yugioh/render_link_marker.py`.

**Runtime (preferred):** `base.svg` exposes per-arrow groups (`#arrow-t`, `#arrow-tr`, …). The app toggles class `active` from the card’s linkmarkers; CSS swaps gray/red pixel rects. Pre-rendered combo sets are **not** shipped — wait for real card data. Any earlier full-combo dump lives in `fallback/link-combos-unused/` (not for product UI).

**Row size:** list/finder/editor show the marker at **16 CSS px** (shared row visible height) (NN from native) so the octagon body matches attribute/race circle weight; no “Link-N” text beside it. Detail chips keep the Link-N label. Size compare: `icons/link-marker-size-before-after.png`. Alignment: `icons/icon-row-alignment-check.png` (PNGs trimmed to visible bounds).

### Icon bake / Link tip integrity (2026-10-28)
- Baker: `docs/data/games/yugioh/bake_icons.py` → `icons/baked/{row,detail}-N/`.
- Link tip-trim α≥1 from owner map (`link/link-marker-map.json`); also writes `*-full.png` (29×29).
- Cover/max-alpha NN keeps all 8 arrow tips (incl. gray) inside the box; tips on shared top/bottom.
- 8× tip check: `link-marker-tips-8x.png`. Alignment: `icon-row-alignment-check.png`.
- Ritual / pendulum-normal / pendulum-synchro / pendulum-fusion frame-mini still missing from owner pack.
