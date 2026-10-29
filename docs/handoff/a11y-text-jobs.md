# a11y-text: the morning's browser jobs, with the predictions written first (rule 15)

Lane a11y-text, branch `a11y-text` (D:/pyrefly-rig-rikkudk), built on `origin/r68-int` 7d80590d0. Nothing here was run in a browser overnight (the browser belongs to the continuity measurement).
Round 30b's own scripts are the model: `critic/rounds/round-30/gaps2/g1/scripts/g1-states.mjs` (the CHK-003 states sweep), `g3/scripts/job3t.mjs` (the TEXT SIZE walk by real keys), and the release-67 gap pass's
`phone-fight.mjs`. The three scripts in this folder (`t1-flag.mjs`, `x1-textsize.mjs`, `p1-phone-line.mjs`) are those, pointed at a candidate address and given the new readers. They pass `node --check`; none has run.

## How to serve the candidate (one server, stopped afterwards)

From the lane tree (it has a `node_modules` junction): `node node_modules/vite/bin/vite.js --port 5321` (a dev server holds about 1.1 GB: stop it by its PID when the jobs are done, AGENTS.md "Stop the servers you start").
Or `npm run build` into the lane tree's `dist/` and serve that. Every job is `--base=http://127.0.0.1:5321/`. One browser job at a time, in the foreground, under the RIG-RECORD lock (`tools/measure/lock.mjs`),
`PYREFLY_BROWSER=gpu`, `TEMP=TMP=D:/Tools/pyrefly-scratch/tmp`.

Evidence folders: `D:/Tools/pyrefly-scratch/2026-10-29/a11y-text/jobs/out/<job>`.

## Job T1: the target flag at the sizes CHK-003 names (PR-0551)  ~6 minutes

`node t1-flag.mjs --base=<candidate> --evidence=<out>/t1` (default sizes 1280x720, 1440x1080, 1600x900, 2000x1012, 2560x1440; Chapter I and Chapter IV).

**Prediction (computed from `pro-markers.css`, `clamp(14px, 0.72vw, 18px)` for TARGET and `clamp(14px, 0.78vw, 19px)` for the damage line; the name and the tag keep their clamps):**

| window | TARGET | damage line | name | tag |
|---|---|---|---|---|
| 1280x720 | 14.0 | 14.0 | 22.0 | 15.0 |
| 1440x1080 | 14.0 | 14.0 | 22.0 | 15.0 |
| 1600x900 | 14.0 | 14.0 | 23.2 | 16.0 |
| 2000x1012 | 14.4 | 15.6 | 29.0 | 20.0 |
| 2560x1440 | 18.0 | 19.0 | 37.1 | 24.0 |

Round 30b read the first two columns at 11.0 and 11.0, 11.0 and 11.2, 11.5 and 12.5 at the first three windows. **Pass:** `min` of the REPORT line is 14.0 or more at every window in both chapters; the flag's plate overlaps no HUD panel by
more than 4 px squared (`plates[].over` is empty at every window; the dock now counts the damage line's width, `plateWidth`); no text is cut (`scrollW` is not over `clientW` on a piece). **A miss** is any size under 14.0 or any panel overlap:
stop, read `t1.json` and the screenshot, do not tune. The plain note ("already Hasted", "HP full") is 14 px too; it only shows when a buff is aimed at a unit that already has it (Haste/Protect/Shell/Reflect on a hasted target, Cure at full HP), so
T1 does not reach it; the unit test pins the declared size.

## Job X1: TEXT SIZE on the F1 HUD, sizes and boxes (PR-0559)  ~10 minutes

`node x1-textsize.mjs --base=<candidate> --evidence=<out>/x1` (1280x720 and 1600x900; Chapter I and IV; TEXT SIZE written the way `applyComfort` writes it: a labelled injection) and the A/B
`node x1-textsize.mjs ... --evidence=<out>/x1 --word=today` (`?f1text=today`: release 67's step-down).

**Prediction, painted px of the first visible probe (authored grid px x the stage scale x the setting):**

| probe (grid px) | 1280x720 (x2): 100 / 115 / 130 | 1600x900 (x2.5): 100 / 115 / 130 |
|---|---|---|
| command label (12) | 24.0 / 27.6 / 31.2 | 30.0 / 34.5 / 39.0 (round 30b read 30.2 at 100) |
| party name (12.5) | 25.0 / 28.8 / 32.5 | 31.3 / 35.9 / 40.6 (round 30b: 31.3 at 100) |
| party HP (16) | 32 / 36.8 / 41.6 | 40 / 46 / 52 |
| hero name (19.5) | 39 / 44.9 / 50.7 | 48.8 / 56.1 / 63.4 |
| boss ribbon name (13.5) | 27 / 31.1 / 35.1 | 33.8 / 38.8 / 43.9 |

Tolerance 1 percent (Chromium rounds a computed size to a tenth). The F1 root keeps `hud-f1` at all three sizes (`f1: true`). **Pass:** the sizes above; `overlaps: []` and `outside: []` at every size, both chapters, both windows.
The grid boxes the unit test computes from the sheets (so the viewport boxes are these x the stage scale; at 16:9 there is no letterbox offset) are:

| zone (grid px: left, top, right, bottom) | Chapter I at 100 | at 115 | at 130 |
|---|---|---|---|
| boss ribbon | 28, 12.5, 188, 37.5 | 28, 12.5, 212, 41.3 | 28, 12.5, 236, 45 |
| hero (width estimated 150) | 28, 140, 178, 166 | 28, 114, 200.5, 143.9 | 28, 87.9, 223, 121.8 |
| cue | 28, 172.5, 206, 188.5 | 28, 151.4, 232.7, 169.8 | 28, 130.2, 259.4, 151 |
| verbs (five rows) | 28, 196.5, 198, 313.5 | 28, 179, 223.5, 313.5 | 28, 161.4, 249, 313.5 |
| prompt bar | 28, 336.5, 218, 353 | 28, 334, 246.5, 353 | 28, 331.5, 275, 353 |
| turn strip (height estimated 60) | 465, 22, 625.5, 82 | 440.9, 22, 625.5, 91 | 416.9, 22, 625.5, 100 |
| party cards | 415, 251, 615, 342 | 385, 237.4, 615, 342 | 355, 223.7, 615, 342 |
| Sensor card (Intel only; 100 x 78 at 436, 144) | 436, 144, 536, 222 | 421, 132.3, 536, 222 | 406, 120.6, 536, 222 |

| zone | Chapter IV at 100 | at 115 | at 130 |
|---|---|---|---|
| boss ribbon | 28, 12.5, 188, 37.5 | 28, 12.5, 212, 41.3 | 28, 12.5, 236, 45 |
| hero (width estimated 150) | 467, 96.5, 617, 122.5 | 443.8, 59.8, 616.3, 89.7 | 420.5, 23.1, 615.5, 56.9 |
| cue | 455, 129, 612, 145 | 430, 97.2, 610.5, 115.6 | 404.9, 65.4, 609, 86.2 |
| verbs (content, four rows) | 467, 152, 612, 250 | 443.8, 123.7, 610.5, 236.4 | 420.5, 95.3, 609, 222.7 |
| prompt bar (150 wide) | 28, 336.5, 178, 353 | 28, 334, 200.5, 353 | 28, 331.5, 223, 353 |
| party cards | 417, 251, 611, 342 | 387.9, 237.4, 611, 342 | 358.8, 223.7, 611, 342 |

The measured boxes (`zones` in `x1.json`, viewport px) should land within 2 grid px of these x the scale. Where they do not: the hero's real width (the estimate is 150), the turn strip's height (60) and the verbs' real list height
(five rows is 117 grid px; a shorter submenu is shorter) are the three estimates, and a measured hero or strip smaller than the estimate is not a miss. **A/B with `?f1text=today`:** the command label at 1600x900 reads about 30.2 /
28.2 / 31.9 (the dip round 30b found) and `f1: false` at 115 and 130; without the word it reads 30 / 34.5 / 39 and `f1: true`.

**Intel (X) reads, added by the review (2026-10-29).** The script presses G (the guide opens and brings Intel back), reads as `<size>-intel`, presses E (the enemy-move slab), reads as `<size>-intel-intent`, and closes both. `ZONES` now holds the guide's sheet
(`.sgd__panel`), its chip (`.sgd__toggle`), the advisor's one-row tip (`.mad__card[data-zone='tip']`) and the slab (`.eint__panel`); an overlap between any two visible zones, or a zone outside the viewport, in ANY read (Intel's included) is a **miss**
(`OUT.misses`, exit code 1; the first pass logged the Intel reads and counted none of them, which is how review M1 got past it).

**Prediction, Chapter I, the guide open with a menu open** (grid px; viewport = x the stage scale; the sheet is at its worst, filling the column down to its floor, which Seymour Flux's long document does):

| size | guide sheet x 21.3 to ..., y | hero | cue | tip card (left, widest right) | turn strip left | `tipGap` (strip left - tip's bounding box) |
|---|---|---|---|---|---|---|
| 100 | 153.3, 66 to 137 | present (140 to 166) | present (172.5 to 188.5) | 35.9, 427.9 | 465 | about 35 |
| 115 | 173.1, 69.8 to 140.8 | **absent** (opacity 0; the sheet would cover 26.8 grid px of it) | **absent** | 225.9, 432.8 | 440.9 | about 6.2 |
| 130 | 192.9, 73.5 to 144.5 | **absent** (the sheet would cover all of it) | **absent** (14.3 grid px) | 250, 408.8 | 416.9 | about 6.2 |

The tip is held to `575.5 - 320.5 x scale` grid px wide at 115 and 130 (206.9 and 158.85; `max-width` in `hudf1-textsize.css`), so a bar that the solver gave the full 226 ends a shear and a clearance short of the strip; a narrower bar leaves more. If the tip stands LEFT of 35.9
(it cannot: that is the solver's leftmost card) or the solver gave it less than the cap, `tipGap` is larger. **A miss** is `tipGap` under 6 grid px (x the scale) at 115 or 130, a hero or cue present in a 115 / 130 `-intel` read, a hero absent at 100, or any overlap. The slab (`intent`) has no prediction:
the solver places it from the boss's head, so its first read is the information; if it overlaps the guide sheet or the ribbon, that is a finding, not a tune. Chapter IV's guide is on the left and its hero, cue and window are on the right: no hero or cue rule, and the same sweep must show no overlap there either.

**Stop rule.** One miss of 5 percent or more on a size, or an overlap over 2 grid px, or a zone outside the viewport at 130: set `F1_GROWS_WITH_TEXT_SIZE = false` in `src/ui/hudf1/HudF1Switch.ts` (one line; the default
returns to release 67's step-down), report, and do not tune the CSS blind.

### Job X1b: the same by real keys (the pause walk)  ~3 minutes each

`g3/scripts/job3t.mjs` copied into the out folder with `open({ width: 1600, height: 900, url: '<candidate>' })` (its `open` takes `url`; do not use its `save()`/`shot()` helpers against the candidate: they write into the release-55 tree, point `OUT` somewhere under
the scratch folder first). Chapter I and IV. **Prediction:** `menu-100` / `menu-115` / `menu-130` command labels 30.2 / 34.7 / 39.3 (Chapter I `Special`), party names (Chapter IV `Yuna`/`Rikku`) 31.3 / 35.9 / 40.7; `under14` stays 0 (it was 1 at 115 on the old build); the pause rows as they were (14, 15.6, 18).

## Job P1: the phone's enemy-move line  ~6 minutes per chapter

`node p1-phone-line.mjs --base=<candidate> --evidence=<out>/p1 --chapter=seymour-flux` and `--chapter=ffx2-bahamut` (390x844 touch; the critic's own fight loop, advisor-led, a win; the poller reads every distinct state of `.eint__body`).

**Prediction.** The release-67 pass saw, in Chapter I, 65 distinct reads, 27 distinct texts, at most 2 visible lines, up to 4 laid out. Now:
- `maxRows` is 2 in every state that has figures and 1 in every state that has none (a Dispel, "Seymour waits"); `maxPanelH` is 48.4 (6 + 18.2 + 18.2 + 6; one row: 30.2); `notPhoneBody` is 0.
- `rowsOverflowing` is empty and `figuresClipped` is empty in all states (the claim of the whole change): every figure drawn is inside the body's box, none is a clipped half.
- `withFigures` is about 20 of 27 texts in Chapter I (every "Lance of Atrophy", "Cross Cleave", "Full-Life" with a target; "Seymour waits" and "Dispel" have none).
- The longest line, "Lance of Atrophy" with SCRIPTED, "Zombie 99%" and three random candidates (Tidus 707-799 / Yuna 746-842 / Kimahri 698-788), reads: row 1 `SEYMOUR FLUX next . Lance of Atrophy . Zombie 99%` after the badge goes (`p-cf`), and the timing too if it still
  overflows (`p-tm`); row 2 now prints the RANGE (review minor 2): `random: Tidus 707-799 / Yuna 746-842 / Kimahri 698-788` is about 54 characters, my estimate 415 of the 343 px, so `p-sh` (`Tid 707-799 / Yun 746-842 / Kim 698-788`, about 362 px) is not enough and `p-pt`
  follows (`random: Tid 753 / Yun 794 / Kim 743`, about 270 px). **So on this line the band does not survive a 390 px phone**; it does on a line with one or two targets (`Tidus 707-799` alone is about 100 px; two ranged figures with short names about 190). `rungUse` says how often: if `p-pt` is on most
  states, the band is a rung that rarely shows and the question for Bailey is whether the figure should be the band on a smaller type or the point (open question 8). The enemy's name is the third rung of row 1 and should NOT be needed in Chapter I.
- `rungUse` is mostly `p-cf` (the badge is the first thing to go on any line with a chip) and rarely `p-tm`; `p-nm`, `p-ch`, `p-el`, `p-el2` are 0 in Chapter I; `p-sh` and `p-pt` are on together on the three-target lines and `p-sm` is 0. Chapter IV (three girls, short names, NO status chip now) is expected to use `p-pt` on the
  three-target lines at most; its row 1 has no chip, so `p-ch` is 0 and `p-cf` is needed less often than in Chapter I.

`bandStates` (states whose figures show a range) and `pointRungStates` (states where `p-pt` took it back) quantify the band question; `chipStates` is 0 in Chapter IV (rule 14: only FFX's phone line ever carried the chip) and equals the states with a status in Chapter I.

`consoleErrors` is empty: in particular no "ResizeObserver loop completed with undelivered notifications" (the fit changes the panel's width inside its own ResizeObserver callback and converges in two passes; a loop notice would mean it does not).

**A miss** is any figure clipped, any row over, a third row, a console error, or a rung beyond `p-nm`: stop, read the state in `p1.json` (text, rungs, row widths) and `last.png`; the ladder's order is `ROW1_RUNGS` / `ROW2_RUNGS` in `enemy-intent-phone.ts`, the only place to change it.

## What the unit tests already settle (so the jobs need not)

- `a11y-text-target-flag` (10): the declared sizes at nine windows; the plate width counts the damage line.
- `a11y-text-f1` (49): the F1 sheets' own numbers evaluated at 1280x720 and 1600x900 for 100/115/130; every zone's box at 100/115/130, none overlapping, none off the 640 x 360 stage; the foot and the right edge are the F1 sheets' numbers; the cascade (each F1 rule outranks the text-size rule it replaces);
  Chapter I's guide rail against every zone (the sheet meets the hero and the cue at 115 and 130 and the sheets hide exactly those two), the tip against the turn strip, and the guide chips and tips following the ribbon at 115 and 130 (review M1, minors 1 and 5).
- `a11y-text-phone-line` (25): the markup, the words, the ladder's order with a fake measure, the panel's follow of the phone attribute, the stylesheet's rungs.
- `a11y-text-review` (12): the phone line's range and point rungs, FFX-2's phone line has no status chip, `TargetCursor.dockFor` reaches `plateWidth`, short names that start alike, the faces-arrive refit (review minors 2, 3, 4, 10, 11).
- Updated: `hud-f1-switch`, `hud-f1-layer`, `r64-declutter-defaults` (the F1 HUD no longer steps down at 115 and 130; `?f1text=today` keeps the old tests' behaviour).
