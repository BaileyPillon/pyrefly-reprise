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

## Repair pass (after the verifier)

- **Refuted: the phone hint under a field name plate.** In chapter 6 at 390x844 the field
  cursor's own name plate (`.ffx-target__plate`, docked under Dr. Goon or Ormi, who stand low
  on the stage) reached into the bar under the stage and covered the middle of the hint. The
  first pass never measured the field plates. Now `plateInputFromDom` (`TargetPlates.ts`) reads
  the field plates and the group label off the overlay each frame. In the bar, `hintBarDrop`
  (`targetPlateGeometry.ts`) drops the hint just under any plate that reaches into it, or hides
  it if the bar runs out. On the stage, `hintPlacement` slides the hint along its row to the
  clear spot nearest the centre, or hides it. Only the hint adapts. The field plate never moves
  for the hint, so the two cannot chase each other. During one target select the bar hint never
  climbs back up, so it settles once and does not hop with each arrow key (Dr. Goon's plate
  hangs lower than Ormi's). The same defect was also in chapter 4 on the phone (Bahamut's
  plate, 102x14 px). The verifier's list did not include that case. It is fixed by the same change.
- **Found in the repair pass: the petals over the plates.** The first pass made the plates
  layer a later sibling of the overlay, but `.ffx-target__plate`'s layer `.ffx-targeting`
  carries `z-index: 36` (`ffx-hud.css`), so a sibling without a z-index lost. On the phone
  Bahamut's ring reached into the bar and a petal covered the actor plate's `WARRIOR` tag.
  `.ffx2hud__plates` now takes `z-index: 36` too. A test compares the two stylesheets.
- **Rule 7:** the intent-slab board (`boardRects`, `fighterBoxes`, `solveSlab`) moved unchanged
  into `src/ui/ffx2/intentBoard.ts`, and the plates' DOM read moved into `TargetPlates.ts`.
  `FFX2BattleHud.ts` is 1215 lines, down from 1341 and below its 1259 before PR-0150. It is
  still over 400. Splitting the rest is its own job.
- Tests: six new cases in `tests/unit/ui-ffx2-target-plates.test.ts` use the refuted frame's own
  measured boxes. With the field plates cut from the layout, the wiring case fails.
- Browser proof. Real keys, GPU (RTX 5070 Ti, D3D11), own vite with HMR off. Chapters 4, 5 and 6 at
  1280x720, 1600x900, 2000x1012 and 390x844, measured in the page against the chrome and now
  also the field name plates: 0 overlaps in 12 of 12. Phone target stepping with ArrowRight
  (chapter 6: Dr. Goon, Ormi, Fem-Goon; chapter 4: Bahamut) found 0 overlaps, and Esc takes the
  plates down. The side-by-side images `side-by-side-*.jpg` were regenerated on the repaired
  build. `repair-before-*` and `repair-after-*` show the chapter 6 phone frame before and after,
  and the chapter 4 phone frame with the petals under the plates.

## Repair pass 2 (after the second verifier)

- **Refuted: the TARGET plate over the field's ALL ENEMIES label.** A whole-side command
  (Rikku's Darkness and Demi in chapter 4; Darkness, Demi, Bio and Black Sky in chapter 5)
  hangs the field cursor's group label (`.ffx-target__all`) over the top of the formation, on
  the plates' own row, and the TARGET plate cut it in half (104x25 px at 1280x720, up to
  152x17 px at 1600x900). `plateInputFromDom` already read the label, but only the hint used
  it. Now `TargetPlates.layout` hands the same field rects to `plateRow`
  (`targetPlateGeometry.ts`): the actor plate treats them as obstacles when it picks its corner,
  and the TARGET plate takes the free spans of its row once the chip, the actor plate, a tall
  command window, the banner and every field label or name plate are cut out. It stays centred
  when that is clear, else goes to the clear spot nearest the centre at its natural width, else
  shrinks into the widest span (never under `MIN_TARGET_W`), else hides. The actor plate also
  gets a new fallback spot, just left of a label standing in the row: in chapter 5 the 13-row
  Skill list already holds the corner, and in one 1600x900 run the label sat right where the
  plate had moved to, so the plate hid. As with the hint, only the plates adapt. The field
  label never moves for them.
- **Rule 7:** the plate tests were split. The pure geometry tests (and the field-plate cases)
  are in `tests/unit/ui-ffx2-target-plate-geometry.test.ts`; the HUD wiring, text, victory
  close, type floor and FFX cases stay in `tests/unit/ui-ffx2-target-plates.test.ts`. Both are
  under 400 lines. Six new cases cover the group label; with the field rects cut from
  `plateRow`, four of them fail.
- Browser proof. Real keys, GPU (ANGLE NVIDIA RTX 5070 Ti, D3D11), own vite with HMR off,
  restarted after the last edit (a vite with `watch: null` keeps serving the module as it was
  at start). The verifier's stress walk visits every targeting row of the first few turns'
  submenus: Attack, White Magic, Rikku's Skill list with Darkness, Demi, Bio and Black Sky, and
  chapter 6's Breaks and Gunner skills. It ran in chapters 4, 5 and 6 at 1280x720, 1600x900,
  2000x1012 and 390x844 (12 runs, 272 measured frames). The in-page measure against the party
  rows, help band, boss plates, command window, chip, telegraph, intent slab, advisor, guide,
  PAUSE chip and the field's name plates and ALL ENEMIES label found 0 overlaps and 0 hidden
  plates. `side-by-side-whole-side-*.jpg` sets the tile beside Darkness in chapter 4 (1280x720,
  1600x900) and Black Sky in chapter 5 (1280x720, 1600x900, 2000x1012).

## Open

- The tile's "Vegnagun — Head" is concept text. Every Vegnagun link's boss is named "Vegnagun"
  in data, so the plate prints the data name (rule 6).
- The enemy-intent slab still shows the dead boss's "ACTS NEXT" card during the victory shot.
  This is shared `ui/common` behaviour and was not in scope.
