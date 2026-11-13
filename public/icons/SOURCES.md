# Shipped Yu-Gi-Oh! UI icons (`public/icons/`)

Baked PNGs for List rows (16 CSS px) and card detail chips (18 CSS px), plus the Link marker SVG master. Copyright Konami / 4K Media; used for OTCP product UI per the approved icon set in `docs/data/games/yugioh/icons.json`.

Design-time masters and owner-pack notes: `docs/images/ui/icons/SOURCES.md`.

| File                                                             | Origin                                                                                                                                      | License / terms   | Retrieved  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------- |
| `row/attr-*.png`, `detail/attr-*.png`                            | Owner `docs/images/ui/icons/attribute/` (baked row-16 / detail-18)                                                                          | Konami / 4K Media | 2026-11-02 |
| `row/prop-*.png`, `detail/prop-*.png`                            | Owner `docs/images/ui/icons/spell-trap/`                                                                                                    | Konami / 4K Media | 2026-11-02 |
| `row/race-*.png`, `detail/race-*.png`                            | Owner `docs/images/ui/icons/source-owner/race/` → normalized `docs/images/ui/icons/race/` (all 25 monster types); baked to row/detail tiers | Konami / 4K Media | 2026-11-02 |
| `row/atk.png`, `row/def.png`, `detail/atk.png`, `detail/def.png` | Master Duel badges from `docs/images/ui/icons/misc/atk.png` and `def.png` (baked row-16 / detail-18)                                        | Konami / 4K Media | 2026-11-02 |
| `row/level.png`, `detail/level.png`                              | Owner `docs/images/ui/icons/source-owner/level/level-star.png` (47×47 cutout; LANCZOS bake to row-16 / detail-18)                           | Konami / 4K Media | 2026-11-02 |
| ban, frame-mini spell/trap, link-base                            | Owner pack under `docs/images/ui/icons/` (see `docs/images/ui/icons/SOURCES.md`)                                                            | Konami / 4K Media | 2026-11-02 |
| `row/rank.png`, `detail/rank.png`                                | Unchanged prior bake from owner `level/level.png` (no separate Rank star in pack; see `icons.json`)                                         | Konami / 4K Media | 2026-11-02 |
| `link-base.svg`                                                  | `docs/images/ui/icons/link/base.svg` (owner pixel-art Link marker)                                                                          | Konami / 4K Media | 2026-11-02 |

Each PNG is under 8 KB. Runtime URLs are prefixed with the Vite base (`/otcp/`) via `publicDataUrl()`.

List view shows these icons only below 768px; detail chips use the `detail/` tier at all widths.
