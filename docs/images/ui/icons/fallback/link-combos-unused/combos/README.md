# Link marker combos

256 states (all-gray base + 255 non-empty arrow sets).

## Naming

`link-m{mask:03d}[-{codes}].{svg,png,@2x.png,@3x.png}`

- **mask** bits (LSB→MSB): `t tr r br b bl l tl` (Top, Top-Right, Right, Bottom-Right, Bottom, Bottom-Left, Left, Top-Left).
- **codes**: active shorts in that order, joined by `-`. Mask `0` is `link-m000` (also `link-base`).
- Example Sample Link Iota (Top + Bottom-Left + Bottom-Right): bits 0+3+5 → mask **41** → `link-m041-t-br-bl`.

## Runtime (preferred)

Use `../base.svg`: one SVG with `<g id="arrow-t" class="arrow">` … groups. Toggle class `active` on each group (CSS swaps gray/red pixel rects). Pre-rendered combos here are fallback/docs/mocks only.
