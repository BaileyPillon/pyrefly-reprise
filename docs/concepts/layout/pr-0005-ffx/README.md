# PR-0005-ffx — Turn cut-in covers the FFX command menu

**Game:** FFX only (Chapters 1-3). The Turn cut-in is Ink & Gold chrome both
games share, but FFX-2's ATB cut-in ("from the right", per
`docs/handoff/presentation-ink-and-gold.md`) has no approved mockup and is not
built (`src/ui/inkgold/cutin.ts`'s `side: 'right'` mirror is documented as
unused). This sheet is FFX-only until an FFX-2 mockup exists.

## The question

The approved "Turn cut-in" tile (`docs/target/targets.json`, src
`docs/screenshots/mockups/A-turn-cut-in.jpg`, delivery `not-scheduled`
&rarr; now built) plays at a party turn start. Since `db7b832`
(`src/engine/TurnCutIn.ts`) the command menu takes keys while the slab plays
— by design, so a fast player isn't blocked — but in FFX the slab (`.ig-cutin`,
`src/ui/inkgold/cutin.ts`, spec geometry 620&times;880 @1440, `slabLeft: -90`)
sits over the same bottom-left region `ffx-hud.css` actually draws the command
cascade in, so it covers ATTACK / SPECIAL / WHITE MAGIC / ITEMS / SWITCH for
the ~0.76s (`CUT_IN_HOLD_MS = 450`, scaled) the slab holds.

**Which fix?**

## The four options

| | Option | What changes | What it costs |
|---|---|---|---|
| A | Slab above the menu | Slab's height is clipped to a band ending above the menu's real top edge (y&asymp;465 @1440) | The approved 620&times;880 portrait plays ~43% shorter than the approved art |
| B | Slab under the menu — **recommended** | Slab geometry and art are untouched; the live command cascade is drawn in a stacking layer above it, matching what `ffx-hud.css` already draws today | One stacking-order change in the presenter's HUD port; no art, timing, or scope change |
| C | Shorter slab (0.4s) | Same footprint and z-order as the live bug; `CUT_IN_HOLD_MS` drops from ~0.76s to 0.4s | Still blocks the menu for the first 0.4s of every first turn — smaller bug, not a fixed one |
| D | Slab only on each member's first turn | Nothing to build — `TurnCutInBeat` (`src/engine/TurnCutIn.ts`) already does exactly this: one cut-in per combatant per battle | Doesn't touch the 0.76s cover on the turn it *does* play; solves a different problem (frequency, not overlap) |

## Recommendation: B

B is the only option that fixes the actual defect (the menu is unusable while
covered) without shrinking or re-timing the approved art. It also costs the
least: a single stacking-order change in the HUD port that already owns both
the cut-in layer and the command cascade (`MomentsPort.turnCutIn`,
`ui/common/transitions/TurnCutInLayer.ts` for the slab; `ui/ffx/FFXBattleHud.ts`
for the cascade) — no change to `TurnCutIn.ts`'s timing or scope logic.

D turned out, on reading `src/engine/TurnCutIn.ts`, to already be the shipped
frequency (one cut-in per member per battle) — it isn't a competing option so
much as confirmation that the frequency is already settled; the open bug is
what happens on the turn the cut-in *does* play, which only A, B or C address.
C is the weakest of those three: it shrinks the window but does not close it.

## Evidence

- Bug: `AGENTS.md`-linked orchestration note, this run's brief.
- Approved art: `docs/target/targets.json` &rarr; "Turn cut-in" tile, src
  `docs/screenshots/mockups/A-turn-cut-in.jpg`.
- Real geometry: `src/ui/inkgold/cutin.ts` (`GEOM`, spec comments), backed by
  `src/ui/inkgold/slabs.css`'s `.ig-cutin*` rules.
- Timing and scope: `src/engine/TurnCutIn.ts` (`CUT_IN_HOLD_MS = 450`,
  `TurnCutInBeat.wants`/`play` — one cut-in per `actorId` per battle, "on the
  first turn of each party member in each battle and never again").
- Real menu position: `docs/concepts/polish/_kit/before/ch1-command-menu.png`,
  a live capture from `https://baileypillon.github.io/pyrefly-reprise/`.

## Files

- `sheet.png` — the 1600&times;900 option sheet (this question).
- `a-band.html` / `.png`, `b-under.html` / `.png`, `c-short.html` / `.png`,
  `d-firstturn.html` / `.png` — one Ink & Gold mockup per option, real
  `ch1-command-menu.png` capture as the background, kit.css tokens (`_cutin.css`
  is this folder's own hand-copy of `.ig-cutin*` from `slabs.css`, at the
  literal spec numbers from `cutin.ts`'s `GEOM` comments), rendered at
  1920&times;1080 via `docs/concepts/polish/_kit/shoot.mjs`.
- `_compose.py` — assembles `sheet.png` from the four renders.

Nothing under `src/`, `tests/`, `critic/`, `public/art/` or
`docs/target/approved-hashes.json` was touched. Nothing here is wired into the
game; PR-0005 is not built until Bailey picks A, B, C or D (or some mix) and
approves it.
