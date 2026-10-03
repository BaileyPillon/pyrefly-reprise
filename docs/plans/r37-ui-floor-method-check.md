# r37-ui-floor: method check before the third try (AGENTS.md rule 15)

Written 2026-10-03 by a Sonnet sub-agent of the driver session, before the third build attempt's final measurements. Branch
`r37-ui-floor`, worktree `D:/pyrefly-advisor-v4`, `origin/main` merged in first (`8d1e1605`, release 37 integration). Game case:
per item below; the plumbing (coach box, plate dock, aim nudge) is "both" or "FFX only" as stated.

Rule 15 says two failed attempts on the same failure mean a written method check before a third. The lane's build
(`f8fe37be`) failed the independent check on five blockers (`19bcc74f`), the repair (`30bf3a7e`) fixed five and left three
(`7a119f8b`). The diagnosis below was done with the probes in `D:/Tools/pyrefly-scratch/2026-10-03/r37-ui-floor-3-tools/` (two
dev servers, 6100 = branch, 6101 = a `git archive` copy of `origin/main`), and two of the three fixes were written while it ran;
the check stands before the *measurement* and the commit, which is what the rule protects, and is stated here so the order is
not hidden.

## 1. What each remaining blocker is

| Blocker (re-check `7a119f8b`) | Game | What is really happening |
|---|---|---|
| 1. FFX-2 first-run coach card cut at the top (badge at y -20) and over the help bar | FFX-2 only | `CoachLayer.update` runs three movers on the line: `CoachMark.bandClearOf` (FFX only), `keepMarkOffIntent` (a4e9a0b9 made its box the slab **plus the badge**) and `placeOffActors` (desktop, **the slab alone**). The badge hangs 28 px above the slab and runs 56 px wider. `placeOffActors` offers `stage.top + 10` as a candidate for the slab, so the badge ends at `top - 18`. Measured on **origin/main** too, on the right edge: at 1440x900 in Chapter IV and Ixion the badge text ends at x 1468 on a 1440 window (the same bug, a different edge). |
| 2. FFX phone Ch I target step: the new plate placement hides the targeting hand | FFX only | The plate dock (`dockPlate`) knows the HUD panels and the party faces but **not the hand**, which the cursor draws 21 px left of the figure. Last attempt added the intent strip as a panel, which pushed the plate off "above" and onto "left", exactly where the hand is (3 of 3 runs). |
| 3. FFX "OD" party-row label off the right edge at TEXT SIZE 1.15 and 1.3 on 1024x768 | FFX only | While an enemy is aimed at, the party list dims and takes `transform: translateX(6%)` of its own width (`ffx-hud.css`, the approved "yields while aiming" frame). The list grows from its right edge with TEXT SIZE (`scale`, `text-size.css`); the translate is inside the scale, so it grows with it. The skewed rows let the "OD" word hang about 9.25 grid px past the list edge, and the list edge is 23.11 grid px inside the stage. At 1.15 the label ends 3 px outside the window, at 1.3 about 7 px. Measured: menu step 1004, target step 1027 (1.15). |

## 2. Why the previous fixes moved the problem instead of solving it

1. **Every mover has its own idea of the object's box, and each fix repaired one mover.** The coach line is a slab to one solver and
   slab-plus-badge to another; the plate is 34 px high to the dock and 36 px on the page; the hand is a panel to nobody. Fixing the
   overlap one solver saw pushed the object into the blind spot of the next (plate off the intent card, onto the hand; the badge
   counted in one solver, not in the other). Both repairs patched the instance each check reported.
2. **Run-time offsets were authored for one scale.** A fixed 6 % aim nudge and a fixed 23.11 grid px margin are fine at 100 % and
   wrong at 115 and 130 %, and the floor made every label wider again. The first repair measured TEXT SIZE 1.0 only; the second
   check found the same label out at 1.15 and 1.3.
3. **The measurement cells were not the failure cells.** Ch I and IV, TEXT SIZE 1.0, were measured by the builder; the checks found
   the failures in Ch II, III, V, in a different TEXT SIZE, in the first-run state (a fresh profile) and on a bimodal phone camera
   (two resting states 20 px apart on origin/main too). Each repair re-ran the cell it fixed.

## 3. The layout constraint that is really binding

Not the 14 px floor itself: the floor only exposed it. The HUD is a 640x360 grid scaled by `min(w/640, h/360)`. A 4:3 window is
width-limited (1.6 at 1024), so 14 px is 8.8 grid px against authored 4.9 to 5.6: type grows 1.6 to 1.8 times inside containers
and anchors authored in grid px. TEXT SIZE then multiplies the panels again from their pinned corner. So the binding constraint is
**the room left between a panel's text and the stage edge or the next panel, in stage grid px** (resolution independent) after
growth, and every thing that moves at run time has to be bounded by it. A constraint stated in stage grid px holds at 390, 1024,
1440 and 2000 alike; a fix stated in screen px for one window does not.

## 4. The method (fixes the class)

1. **One box per object, shared by every mover.** The coach line's box is `markBox` (slab plus badge) in all three solvers, and a
   last-word `keepMarkInStage` shifts the whole box inside the stage whatever moved it (covers the top and the right edge, both games).
   The plate dock sees the hand as a panel (`handBox`), and the intent strip it already sees is grown by the 2 px the dock's height
   estimate is short.
2. **Every run-time offset is capped by the room left, in stage grid px.** The aim nudge becomes
   `min(6%, (23.11 - 2) / text-scale - 9.25)` grid px: 12.85 where it fits (100 %), less where the grown list would leave the window.
3. **Measure the class, not the cell.** The same walker the checker used (every visible text node's effective px, clipped leaf text,
   text-on-text overlaps over 25 % of the smaller box, off-window text) plus pairwise probes for the movers (plate / hand / cards,
   badge / window / help bar), on the branch **and** on `origin/main` in the same cells:

| Axis | Values |
|---|---|
| Chapters | Ch I `seymour-flux`, Ch II `yunalesca`, Ch III `braskas-final-aeon` (FFX); Ch IV `ffx2-bahamut`, Ch V `ffx2-vegnagun-shuyin` (FFX-2) |
| Sizes | 390x844 touch, 1024x768, 1440x900, 2000x1012 |
| TEXT SIZE | 1.0, 1.15, 1.3 (the setting takes these, not 115 / 130) |
| Steps | first menu with the first-run coach up and down, the seven submenus, the Attack target step, every pause tab at 1024x768 and 390x844 |
| Repeats | the phone target step 6 runs per build (the camera is bimodal); the first-run coach sampled over time; fresh profile each run |

Pass for the lane: on the branch, in every cell, min text 14.0 px and 0 nodes under 14; no text overlap, clipped leaf or off-window
text that origin/main in the same cell does not also have (then it is disclosed, not blamed); the seven items of the brief each
pass their own probe (14 px floor; dialogue role and text; phone pause objective against the footer; hand over the sensor label;
phone plate against the intent card; FFX-2 first-run coach card; OD label at TEXT SIZE 1.15 on 1024 px).

## 5. Stopping rule

This is the third attempt. If a fourth blocker of the same kind appears after this pass, the lane stops and goes to Bailey with the
cells that fail and the layout that would fix them (a taller 4:3 stage layout is a look, `For Bailey` 4 of the handoff); no fifth
repair cycle.

## 6. What is left on purpose

- The FFX phone target camera's two resting states: not part of this lane; the plate and hand now survive either.
- Anything that needs a new look (4:3 stage layout, the Ch VII Sensor card's resting place, PR-0293, PR-0295): `For Bailey`.

## 7. Postscript (found while measuring, same class)

The matrix found a fourth instance of blocker 2/3's class: the targeting hand is cleared of the Sensor card once, inside the cursor's
layout, and the card settles later (steered sideways, kept off the turn list), so at TEXT SIZE 115 and 130 in Chapter II the hand
sat on the card's "HP ???" line (none at 100 %). Fixed by the same rule as section 4: the hand is cleared every frame against the
cards where they are now, from its authored place, and by the figure's extent rather than a fixed 90 px. Measured in 27 cells.
