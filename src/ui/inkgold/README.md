# Ink & Gold

Shared presentation layer for Direction A (approved 2026-09-15, round 2).
Spec: `docs/handoff/presentation-ink-and-gold.md`. Owns tokens, slab/screen
CSS, the screen wipe and the turn cut-in. Does not own any HUD or menu wiring.

## Adopting it
1. Call `installInkGoldStyles()` once, add `.ig` to your overlay root
   (`.ig--ffx2` too, for FFX-2 chapters — repoints the accent to pink and
   mirrors skew/edge, see below).
2. Replace battle chrome with `slabs.css` (`.ig-slab`, `.ig-banner`,
   `.ig-cmd-stack`/`.ig-cmd`, `.ig-ctb`, `.ig-stat-list`/`.ig-stat`,
   `.ig-reticle`, `.ig-damage`, `.ig-surface`) and other screens with
   `screens.css` (`.ig-title*`, `.ig-prep*`, `.ig-dialogue*`, `.ig-minigame*`,
   `.ig-bosshp`). Cascading rows read a `--ig-*-step` var, multiplied by
   index per row, as `HudMock.ts` does with `top`/`opacity` today.
3. Call `playWipe(root, opts)` between screens; `showTurnCutIn(...)` on
   `turn-ready`, `dismiss()` its handle when the turn ends.

Fonts: `@font-face` lives in `src/ui/common/fonts.css` (`--font-serif`),
already loaded — `--ig-font-serif` just falls back to it.

## FFX-2 mirroring
`.ig--ffx2` flips `--ig-skew`/`--ig-skew-inverse` and `--ig-edge` (0→1) in
`tokens.css`. Every slab reads the skew vars, so they mirror for free;
`.ig-stat`/`.ig-reticle__name` split their border into left/right widths
driven by `--ig-edge` — also variable-only. `left`/`right` anchors can't
come from a variable (the idle side needs `auto`), so `.ig-banner`,
`.ig-stat-list` and `.ig-reticle__name` get one small `.ig--ffx2` override
each. `.ig-stat__sphere`/`.ig-damage__chain` are new FFX-2 additions; title/
prep/dialogue/minigame have no mocked FFX-2 variant, so they just inherit
the skew vars.

## What's still theirs
- Command/CTB/party/roster row data, order and live menu state.
- The cut-in's command stack/info slab and the minigame's live timer value
  (`.ig-cmd-stack--lg`/`.ig-cutin__info*`/`.ig-minigame__ring` match visually,
  but all are HUD-driven).
- Battle-start/results/chapter-select layouts (shared primitives only), and
  camera motion (roll, push-in, DoF) via `BattleCamera`'s rig API.

## Scoping rule for consumers

`docs/CONTRACT-CHANGES.md` decision 10: **only files under `src/ui/inkgold/` may
declare a bare `.ig-*` rule.** In a consumer stylesheet every `.ig-*` selector
must be scoped by an ancestor or co-class that stylesheet owns —
`.ffx-hud .ig-minigame`, not `.ig-minigame`.

This is not theoretical. An unscoped `.ig-minigame { opacity: 0 }` in the FFX
HUD's stylesheet hid both FFX-2 minigame overlays, and nothing reported an
error: the selector matched a component in a screen that stylesheet had never
heard of. Bare `.ig-*` rules here are the shared contract; bare `.ig-*` rules
anywhere else are action at a distance.
