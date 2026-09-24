# PR-0150, HUD half: the s3 target-select plates, and the victory under an open menu

**Game case: FFX-2 only** (AGENTS.md rule 14). The approved tile is FFX-2's own
frame, "Targeting in FFX-2: a Vegnagun part" (`docs/concepts/targeting/b-ring-and-dim/s3.png`,
Bailey 19 Sep 2026, "B: hand, ring and a quiet dim"). The FFX frames (s1, s2) have no
TARGET plate, actor plate or controls hint, and only FFX-2's ATB runs under an open menu.
The presenter half (hold the frame, keep the party in shot) is afb1657a / 56fecba9.

## What was built

- `src/ui/ffx2/TargetPlates.ts`: the three plates. TARGET plate = `TARGET`, the target's
  data name, `PART` when `flags.isPart`; `All enemies` / `All allies` for a group command.
  Actor plate = the girl's name and her dressphere (special dressphere while she is in one).
  Controls hint = `ENTER CONFIRM`, `← → CHANGE TARGET` (only when there is something to step
  to), `ESC BACK`.
- `src/ui/ffx2/targetPlateGeometry.ts`: pure placement. Top row = the Active/Wait chip's row
  (grid y 22 to 39): under the D-040 help band, above the boss strip. Actor plate top right,
  moves under the telegraph or left of a tall submenu, or hides. The TARGET plate is centred
  in whatever room the row has left, or hides. The hint sits bottom centre, under the advisor
  card and left of the party column. On a portrait letterbox (390x844) the row moves into the
  bar above the help band and the hint into the bar below the stage, zoomed to 11 px text.
- `src/ui/ffx2/target-plates.css`, drawn on `.ffx2hud__plates`, a second 640x360 layer
  stacked above the reticle overlay, so the six-petal flower never paints over a plate.
- `FFX2BattleHud.ts`: shows and hides the plates with the selection and places them every
  frame. The intent slab steers around them (with its `E HIDE` chip's height).
  `CommandMenu.ts`: `onSelection` also passes the candidate count.
- **Victory under an open menu**: `FFX2BattleHud.onEvent` closes the menu, the reticle and the
  plates on the deciding `ko` (the engine has already set `state.result`), or on
  `victory`/`defeat`, whichever it sees first. `sync` does the same for a decided state.
  Before the fix the presenter closed the menu only after the whole burst (`runActivePump` ->
  `abandon`), after the victory shot.

## Proof

- `tests/unit/ui-ffx2-target-plates.test.ts` (14 tests). The two victory/defeat cases fail
  with the fix switched off and pass with it.
- Real keys, GPU (RTX 5070 Ti, D3D11), chapters 4, 5 (Leg link, Node A) and 6 at 1280x720,
  1600x900, 2000x1012 and 390x844: all three plates present in all 12 runs. Zero overlaps with
  the party rows, help band, boss plates, command window, chip, telegraph, intent slab and its
  chip, advisor card, guide and PAUSE chip (measured in the page). Smallest text is 10 px at
  1280x720, 12.5 px at 1600x900, 14.1 px at 2000x1012 and 11 px on the phone. Side by side with
  the tile: `docs/screenshots/pr0150-hud/side-by-side-*.jpg`.
- Victory under an open menu (Active, chapter 4, 1600x900: Paine's target select open,
  Bahamut staged at 1 HP with Poison, the kill comes through the Active pump): before, the menu
  and reticle were still up at +900 ms, in the victory pose. After, they are gone by +250 ms.
  See `docs/screenshots/pr0150-hud/victory-under-menu-*.jpg`.

## Open

- The tile's "Vegnagun — Head" is concept text. Every Vegnagun link's boss is named "Vegnagun"
  in data, so the plate prints the data name (rule 6).
- The enemy-intent slab still shows the dead boss's "ACTS NEXT" card during the victory shot.
  This is shared `ui/common` behaviour and was not in scope.
