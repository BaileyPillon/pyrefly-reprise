# sphere-b: paper preflight (AGENTS.md rule 15)

Written before building, 2026-09-30. `node tools/critic-plan.mjs --paths
src/ui/ffx/party-prep/SphereGridPanel.ts,src/ui/ffx/party-prep/SphereGridView.ts`
says **DEEP**, for the build's history ("30 substantial checkpoints since the last
deep review"); the only system it names is "FFX HUD". This is the paper check.

**Decision:** D-295, Bailey 2026-09-29 evening: Sphere Grid **B** (bigger grid, legend
in words, node preview and path, a real phone page), built on top of `sphere-ac`
(A + C, D-290). **Game case: FFX only.** The Sphere Grid is FFX's levelling board
[research/visual-bible.md §5.4, research/ffx-combat-core.md §10]; FFX-2 has the Garment
Grid and `src/ui/ffx2/` is not touched. The shell's phone CSS is keyed on
`data-tab='sphere-grid'`, a tab only FFX registers.

**Targets:** `docs/concepts/fb-0929/sphere/option-b-layout.jpg` (1600x900) and
`option-b-phone.jpg` (390x844). What they do not show is not added, except what A and C
already approved (AUTO-LEARN, `?`, the result card) and the shell's own hint line
(ENTER / ESC BACK: the only pointer way back).

## What changes, and what it can break

| Change | Risk | Guard |
|---|---|---|
| New route finder (`sphereGridRoute.ts`): the cheapest walk to any node, priced like `moveCost` | A second copy of the price rules drifting from the model | One Dijkstra, shared with AUTO-LEARN's `nextTarget` (which now calls it). Tests: the route's S.Lv equals what `moveTo` then takes, step by step. |
| Node preview (the card: `STR 31 → 33`, sphere `12 → 11`, path S.Lv, S.Lv after) | A preview that lies | The preview is a **dry run**: snapshot, walk and activate through the model's own `moveTo` / `activate`, read the result, restore (`restoreGrid`, already proven exact by sphere-ac). Tests: preview numbers equal a real walk-and-activate and equal the same steps by hand; the build is byte-equal after a preview. |
| WALK AND ACTIVATE (button, second click, Enter) | A new rule; a half-done walk | Only `moveTo` per step and then `activate` on the node it stands on (the next-door question stays as today); a lock is opened from the node beside it, as the model already does. If any step fails, restore the snapshot: all or nothing. |
| Keyboard cursor may now walk further than one link (it steps along links from the cursor) | Enter acting somewhere the player did not mean | Enter now acts on any node the card describes, and the card says what it will do and what it costs before it happens. |
| Desktop layout for this tab (grid 1040x569 at 1600x900, rail of portraits, card, legend, pouch in words, START) | Other tabs moved; the shell's roster and slots | Every rule keyed on `.prep[data-tab='sphere-grid']` (set by `phonePrep.setTab` on every width) and scoped to `min-width: 600px`; the roster/slots are hidden only on this tab; the rail uses the shell's own `data-action="prep:member-N"`. |
| Phone page (390x844) | The letterboxed board; A/C's dock | Under 600 px the stage becomes one column (the CHAPTER tab's recipe); the canvas keeps `touch-action: none` so a drag pans the grid while the page scrolls elsewhere; every control at least 44 px; A and C keep their phone layers; the sphere-ac dock is not needed on this page (AUTO-LEARN and `?` are in the page). |
| Canvas text on an unscaled phone page | 5 px labels | A `--sg-unit` scale the view reads (1 on the desktop board, ~2.3 on the phone) so the canvas draws at the same apparent size. |
| `SphereGridView.ts` 753 lines, `party-prep.css` 462 | Growing files over 400 | Tooltip / token / ground painting move to a new `sphereGridPaint.ts`; route drawing is a new module; new CSS in new files; both old files shrink. |

## Rules not invented

- Prices: the model's (1 S.Lv onto new ground; 1 per four travelled steps [§10.1]).
- Activation: only the node the character stands on (as the tab does today).
- Locks: the route never passes through a closed lock; a closed lock as the *target*
  is reached by walking beside it and opening it with its key, as a click does today.
- Route choice: least S.Lv, then fewest steps, then lowest node ids. Deterministic.

## Evidence plan

Dev server on 8510 (stopped by PID), headless Playwright on the GPU (ComfyUI busy: timings
say so). Desktop 1600x900: mouse select, card numbers, route drawn, WALK AND ACTIVATE,
second click, Enter; keyboard walk; AUTO-LEARN + UNDO still exact; `?` card. Phone
390x844 by taps: every control >= 44 px, no horizontal scroll, drag pans the grid, the
page scrolls. Target | build sheets into `docs/concepts/fb-0929/sphere/final-b/`.
